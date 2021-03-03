const { App } = require("@slack/bolt");
const axios = require("axios");
const calendarAPI = require("./calendarAPI");
const slackViews = require("./slackViews");
const foundation_managers = require("./foundation_managers");
const store = require("./store");

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
//https://slack.dev/bolt-js/concepts#web-api
// const { WebClient, LogLevel } = require("@slack/web-api");
// const client = new WebClient({
//   token: process.env.SLACK_BOT_TOKEN,
//   // LogLevel can be imported and used to make debugging simpler
//   logLevel: LogLevel.DEBUG
// });

let currentUser = {
  email: "",
  name: ""
};

// app.event("app_home_opened", ({ event, say }) => {
//   // Look up the user from DB
//   let user = store.getUser(event.user);
//   if (!user) {
//     user = {
//       user: event.user,
//       channel: event.channel
//     };
//     store.addUser(user);

//     say(
//       `Hello and welcome <@${event.user}>, I’m BookerBee! :bee: \n\n I am here to book your Essential Foundation course, by sending real time messages to your Foundation Manager (FM) for approvals. I will send you a message when your FM has either approved or rejected your request . If your course attendance has been approved, you can check the status of your booking (attending, waitlisted, rejected) by clicking the "my courses" button.  :smile:`
//     );
//   }
//   // else {
//   //   //say("Hi again! I'm sending a lot of messages at the moment but I'll be fixed soon!");
//   // }
// });

// When app home home opened
app.event("app_home_opened", async ({ body, event, context, say }) => {
  console.log("app home opened");

  try {
    const res = await app.client.users.info({
      token: context.botToken,
      user: event.user
    });

    var view = await slackViews.homePage(res.user); //res.user.profile.email
    let newView = JSON.parse(view.view);

    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await app.client.views.publish({
      /* retrieves your xoxb token from context */
      token: context.botToken,
      /* the user that opened your app's app home */
      user_id: event.user,
      /* the view object that appears in the app home*/
      view: newView
    });
  } catch (error) {
    console.error(error);
  }

  // if user not attending any courses yet, introduce the app!
  if (view.numCourses == 0) {
    console.log("greeting message sent");
    await say(
      `Hello and welcome <@${event.user}>, I’m BookerBee! :bee: \n\n I am here to book your Essential Foundation course, by sending real time messages to your Foundation Manager (FM) for approvals. I will send you a message when your FM has either approved or rejected your request . If your course attendance has been approved, you can check the status of your booking (attending, waitlisted, rejected) by clicking the "my courses" button.  :smile:`
    );
  }
});

// Listens to incoming messages
app.message(/.*/, async ({ message, say }) => {
  //[\s\S]*
  // say() sends a message to the channel where the event was triggered
  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hey there <@${message.user}>! I'm not set up to understand messages from you at the moment. To interact with me, you need to navigate to the *Home* tab, where you can:`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "• View your current course attendance requests \n • Make a NEW request to attend a course \n"
        }
      }
    ],
    text: `Hey there <@${message.user}>!`
  });
});

// Opens modal showing user the courses they are attending and awaiting approval
app.action("view_my_courses", async ({ body, ack, say, context }) => {
  await ack();
  //get user email and full name from Slack workspace
  try {
    const result = await app.client.users.info({
      token: context.botToken,
      user: body.user.id
    });
    //add name and email to Slack's user object to be used in request
    body.user.email = result.user.profile.email;
    body.user.real_name = result.user.profile.real_name;
    // console.log(body.user)
  } catch (error) {
    console.log("Could not get user slack details");
    console.error(error);
  }

  try {
    var view = await slackViews.myCourses(body);
    // replace course name?
    view = JSON.parse(view);
    const result = await app.client.views.open({
      trigger_id: body.trigger_id,
      /* retrieves your xoxb token from env */
      token: process.env.SLACK_BOT_TOKEN,
      /* the user that opened your app's app home */
      user_id: body.user,
      clear_on_close: true,
      /* the view object that appears in the app home*/
      view: view
    });
  } catch (error) {
    //console.error(error);
  }
});

// On book course button press display modal with manager approval checkbox. pass course_id in priv metadata
app.action(/book_course_1*/, async ({ body, ack, say }) => {
  try {
    // Acknowledge the action
    await ack();
    //console.log("book course");
    //console.log(body["actions"][0]["action_id"]); // 'book_course_<id>'
    let course_id = body["actions"][0]["action_id"].replace(
      "book_course_1_",
      ""
    );
    course_id = String(course_id);
    // show course booking modal
    var view = await slackViews.bookCourse1(course_id);
    // replace course name?
    view = JSON.parse(view);
    view.private_metadata = course_id;

    /* view.open is the method used to open a modal */
    const result = await app.client.views.open({
      trigger_id: body.trigger_id,
      /* retrieves your xoxb token from env */
      token: process.env.SLACK_BOT_TOKEN,
      /* the user that opened your app's app home */
      user_id: body.user,
      clear_on_close: true,
      /* the view object that appears in the app home*/
      view: view
    });
    //console.log(result);
  } catch (error) {
    //console.error(error);
  }
});

// On manager approval checkbox select, show complete book course modal. pass course_id in priv metadata
app.action("manager_approval", async ({ body, ack, say }) => {
  try {
    // Acknowledge the action
    await ack();
    // show course booking modal
    var newView = await slackViews.bookCourse2();
    newView = JSON.parse(newView);
    newView.private_metadata = body.view.private_metadata;

    const result = await app.client.views.update({
      view_id: body.view.id,
      trigger_id: body.trigger_id,
      /* retrieves your xoxb token from env */

      token: process.env.SLACK_BOT_TOKEN,
      /* the user that opened your app's app home */
      user_id: body.user,
      clear_on_close: true,
      /* the view object that appears in the app home*/
      view: newView
    });
    //console.log(result);
  } catch (error) {
    //console.error(error);
  }
});

// Handle course request modal submit: API requestApproval, send approval request to manager and confirmation to user
app.view("course_application_modal", async ({ ack, body, view, context }) => {
  // Acknowledge the view_submission event
  await ack();
  console.log("course booking submitted");
  let course_id = view.private_metadata;
  // get user name and email
  try {
    const result = await app.client.users.info({
      token: context.botToken,
      user: body.user.id
    });
    //console.log(result)
    body.user.email = result.user.profile.email;
    body.user.real_name = result.user.profile.real_name;
    //console.log(result["user"]["name"])
  } catch (error) {
    //console.log(error);
  }

  // format course id and user details as metadata - for requestApproval API call and view metadata
  const metadata = {
    id: course_id,
    name: body.user.real_name,
    email: body.user.email,
    user: body.user
  };
  // get selected manager from modal
  let values = view.state.values;
  let v = Object.entries(values);
  v = v[0][1];
  v = Object.values(v);
  let manager_name = v[0]["selected_option"]["value"];

  // API add to waitlist
  var res, message;
  try {
    res = await calendarAPI.requestApproval(metadata);
    message = `Hi ${body.user.real_name}! Your application to attend the course has been sent to ${manager_name}. I'll let you know when they respond, and you can view the status of all of your current course applications in the *Home* tab by clicking *View My Courses*.`;
    //return res;
  } catch (error) {
    console.log("requestApproval failed");
    if (error.response.data.match(/.*Already awaiting approval/)) {
      message = `You are already awaiting approval for the course you just tried to book. You can check your current course applications using the "View My Courses" button on the app home.`;
    } else if (error.response.data.match(/.*Already On Waitlist/)) {
      message = `You are already on the waitlist for the course you just tried to book. You can check your current course applications using the "View My Courses" button on the app home.`;
    } else if (error.response.data.match(/.*Already Rejected from event/)) {
      message = `Your attendance request for the course you just tried to book has already been rejected. You can check your current course applications using the "View My Courses" button on the app home.`;
    } else if (error.response.data.match(/.*Already attending/)) {
      message = `You are already attending this course! You can check your current course applications using the "View My Courses" button on the app home.`;
    } else {
      message = error.response.data;
    }
  }

  // tell user what's going on - already applied, awaiting approval
  //blocks = JSON.parse(blocks);
  try {
    // Call chat.postMessage with the built-in client
    const result = await app.client.chat.postMessage({
      token: context.botToken,
      channel: body.user.id,
      text: message
      //blocks: blocks
    });
    //console.log(result);
  } catch (error) {
    //console.error(error);
  }
  // If requestApproval API call was succesful, send message to manager
  if (message.match(/Hi.*/)) {
    //(!message.match(/You*/)) {
    let manager_email = await slackViews.getManagerEmail(manager_name);
    //find email address, slack id, send message
    // get manager_ slack ID from manager_ email
    var manager_user = "";
    try {
      const result = await app.client.users.lookupByEmail({
        token: context.botToken,
        email: manager_email
      });
      let manager_user = result["user"]["id"];
      let blocks = await slackViews.requestApproval(metadata);
      blocks = JSON.parse(blocks);
      // add metadta to button values
      //console.log(blocks.length);
      blocks[4].elements[0].value = JSON.stringify(metadata); // !!! 4 is hard coded, will have to change if you re-format slackViews.requestApproval
      blocks[4].elements[1].value = JSON.stringify(metadata);
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: manager_user,
        blocks: blocks
      });
    } catch (error) {
      //console.error(error);
      console.log("manger approval message send fail");
      try {
        // Call chat.postMessage with the built-in client
        message = `Sorry, we weren't able to contact your manager. Please get your manager's approval manually, and then contact ${foundation_managers.admin_email} to update your course booking.`;
        await app.client.chat.postMessage({
          token: context.botToken,
          channel: body.user.id,
          text: message
          //blocks: blocks
        });
        //console.log(result);
      } catch (error) {
        //console.error(error);
      }
    }
  }
});

// Handle manager_ response
app.action(/manager_.*/, async ({ body, ack, say }) => {
  try {
    // Acknowledge the action
    await ack();

    let metadata = body["actions"][0]["value"];
    metadata = JSON.parse(metadata);
    var res,
      succesfulAPI = true;

    // switch case
    switch (body["actions"][0]["action_id"]) {
      case "manager_approve":
        metadata.response = "approved";
        try {
          res = await calendarAPI.ApproveUser(metadata);
          console.log("user acceptance success");
          //return res;
        } catch (error) {
          //console.error(error);
          console.log("user acceptance failed");
          res = error.response.data.error;
          succesfulAPI = false;
          //console.error(error.response.data);
        }
        break;
      case "manager_deny":
        metadata.response = "denied";
        // Calendar API call - rejectUser
        try {
          res = await calendarAPI.rejectUser(metadata);
          console.log("user rej success");
          //await say("Request has been denied.");
        } catch (error) {
          console.log("user rejection failed");
          res = error.response.data.error;
          succesfulAPI = false;
        }
        break;
      default:
    }
    // update manager and attendee on the response
    if (succesfulAPI) {
      // Send approval/rejection message to user
      try {
        //let blocks = await slackViews.requestResponse(metadata);
        let blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Your request to attend the following course has been *${metadata.response}* by ${body.user.name}.\n To make any changes to your course request, (for example to cancel the course booking, or to update your manager's response if they change their mind), please contact ${foundation_managers.admin_email}.`
            }
          }
        ];
        let courseDetailBlock = await slackViews.getCourseDetailBlock(
          metadata.id
        );
        blocks = blocks.concat(JSON.parse(courseDetailBlock));
        blocks = JSON.stringify(blocks);
        blocks = blocks.replace("$response", metadata.response);

        await app.client.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          channel: metadata.user.id,
          blocks: blocks
        });
      } catch (error) {
        //console.error(error);
        console.log("failed to let user know manager's response");
        console.error(error);
      }
      //Edit original request message to reflect manager's response
      try {
        // Call chat.update  with the built-in client
        let blocks = await slackViews.updateRequest(metadata);
        blocks = JSON.parse(blocks);
        // const result = await client.chat.update({
        const result = await app.client.chat.update({
          ts: body.container.message_ts,
          token: process.env.SLACK_BOT_TOKEN,
          channel: body.container.channel_id,
          as_user: true,
          blocks: blocks
        });
      } catch (error) {
        //console.error(error);
        let message = `The requst has been <@${metadata.response}>.`;
        try {
          await app.client.chat.postMessage({
            //thread_ts: body.container.message_ts,
            token: process.env.SLACK_BOT_TOKEN,
            channel: body.user.id,
            as_user: true,
            text: message
            //blocks: blocks
          });
        } catch (error) {
          //console.error(error);
        }
      }
    } else {
      // API call has failed - let manager know they have to respond manually :(
      let message = `Sorry, I couldn't process that request. To approve or deny this request, please contact ${foundation_managers.admin_email} directly, quoting the applicant and course details.`;
      try {
        await app.client.chat.postMessage({
          //thread_ts: body.container.message_ts,
          token: process.env.SLACK_BOT_TOKEN,
          channel: body.user.id,
          as_user: true,
          text: message
          //blocks: blocks
        });
      } catch (error) {
        //console.error(error);
      }
    }
  } catch (error) {
    //console.error(error.data);
  }
});

// Wimbledon apply button
app.action("wimbledon_1", async ({ body, ack, say }) => {
  console.log("wimbledon app button");
  try {
    // Acknowledge the action
    await ack();
    //console.log("book course");
    //console.log(body["actions"][0]["action_id"]); // 'book_course_<id>'

    // show intern check modal
    var view = await slackViews.wimbledon1(body.user);
    // replace course name?
    view = JSON.parse(view);
    //view.private_metadata = course_id;

    /* view.open is the method used to open a modal */
    const result = await app.client.views.open({
      trigger_id: body.trigger_id,
      /* retrieves your xoxb token from env */
      token: process.env.SLACK_BOT_TOKEN,
      /* the user that opened your app's app home */
      user_id: body.user,
      clear_on_close: true,
      /* the view object that appears in the app home*/
      view: view
    });
    //console.log(result);
  } catch (error) {
    //console.error(error);
  }
});

app.action(/wimbledon_checkbox_.*/, async ({ body, ack, say }) => {
  try {
    // Acknowledge the action
    await ack();
    // console.log("wimbledon_checkbox");

    // check view state, to see if all 3 checkboxes are checked!
    let values = body.view.state.values;
    let id_ = Object.keys(body.view.state.values).toString();
    // console.log(id_);
    //get state ID
    let selectedOptions =
      values[id_].wimbledon_checkbox_1.selected_options.length;
    // let v = Object.entries(values);
    // v = v[0][1];
    // v = Object.values(v);
    // let manager_name = v[0]["selected_option"]["value"];

    // if all 3 checkboxes ticked, update view
    if (selectedOptions === 3) {
      var newView = await slackViews.wimbledon2(body.user);
      newView = JSON.parse(newView);

      // show box link modal
      /* view.open is the method used to open a modal */
      const result = await app.client.views.update({
        view_id: body.view.id,
        trigger_id: body.trigger_id,
        /* retrieves your xoxb token from env */
        token: process.env.SLACK_BOT_TOKEN,
        /* the user that opened your app's app home */
        user_id: body.user,
        clear_on_close: true,
        /* the view object that appears in the app home*/
        view: newView
      });
    }
    //console.log(result);
  } catch (error) {
    //console.error(error);
  }
});

// wimbledon
app.view("application_form_modal", async ({ ack, body, view, context }) => {
  try {
    // Acknowledge the action
    await ack();
    // get box link from modal
    let values = view.state.values;
    let v = Object.entries(values);
    let box_link = v[0][1]["box_link_input-action"]["value"];
    // get selected manager from modal
    // console.log(v);
    // let manager_name = v[1][1]["manager_select"]["selected_option"]["value"];

    // get user name and email
    try {
      const result = await app.client.users.info({
        token: context.botToken,
        user: body.user.id
      });
      //console.log(result)
      body.user.email = result.user.profile.email;
      body.user.real_name = result.user.profile.real_name;
      //console.log(result["user"]["name"])
    } catch (error) {
      //console.log(error);
    }

    // format course info, box link and user details as metadata - for requestApproval API call and view metadata
    const metadata = {
      id: foundation_managers.wimbledon_course_id,
      name: body.user.real_name,
      email: body.user.email,
      user: body.user,
      box_link: box_link,
      course_id: foundation_managers.wimbledon_course_id
    };

    // console.log(metadata);
    // console.log("index.js:555 ", metadata);
    let res = await slackViews.requestWimbledonApproval(metadata);
    // console.log(res);
    // send message to Megan!!
    try {
      //get slack ID by email adress
      const receiverInfo = await app.client.users.lookupByEmail({
        token: context.botToken,
        email: foundation_managers.wimbledon_application_receiver_email
      });
      // message send message to reviewer through BookerBee
      const result = await app.client.chat.postMessage({
        token: context.botToken,
        channel: receiverInfo.user.id,
        // text: message
        blocks: res
      });
      //send confirmation message to applicant 
            const confirmMessage= await app.client.chat.postMessage({
        token: context.botToken,
        channel: metadata.user.id,
        text: `Your application is being reviewed by <@${receiverInfo.user.id}>. Good luck! :tennis:`
        // blocks: res
      });
      //console.log(result);
    } catch (error) {
      //console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
});

// Start your app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();

// global error handler
app.error(error => {
  // Check the details of the error to handle cases where you should retry sending a message or stop the app
  console.error(error);
});
