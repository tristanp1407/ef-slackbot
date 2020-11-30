const { App } = require("@slack/bolt");
const axios = require("axios");
//const store = require("./store");
const calendarAPI = require("./calendarAPI");
const slackViews = require("./slackViews");

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

// When app home home opened
app.event("app_home_opened", async ({ event, context }) => {
  console.log("app home");
  // set global variable with list of courses
  global.courses = [];
  try {
    //let user = event.user;
    var view = await slackViews.viewCourses(event.user);
    view = JSON.parse(view);
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await app.client.views.publish({
      /* retrieves your xoxb token from context */
      token: context.botToken,
      /* the user that opened your app's app home */
      user_id: event.user,
      /* the view object that appears in the app home*/
      view: view
    });
  } catch (error) {
    console.error(error);
  }
});

// Opens modal showing user's courses 
app.action("view_my_courses", async ({ body, ack, say }) => {
  await ack();
  
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
    console.error(error);
  }
});

// On book course button press display modal with manager approval checkbox. pass course_id in priv metadata
app.action(/book_course_1*/, async ({ body, ack, say }) => {
  try {
    // Acknowledge the action
    await ack();
    //console.log("book course");
    console.log(body["actions"][0]["action_id"]); // 'book_course_<id>'
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
    // console.log(view);
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
    console.error(error);
  }
});

// On manager approval checkbox select, show complete book course modal. pass course_id in priv metadata
app.action("manager_approval", async ({ body, ack, say }) => {
  try {
    // Acknowledge the action
    await ack();
    let course_id = body["actions"][0]["action_id"].replace(
      "book_course_1_",
      ""
    );
    course_id = String(course_id);
    // show course booking modal
    var newView = await slackViews.bookCourse2(course_id);
    newView  = JSON.parse(newView);
    newView .private_metadata = course_id;
    const result = await app.client.views.update({
      view_id:body.view.id,
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
    console.error(error);
  }
});

// Handle course request modal submit: send approval request to EPM
app.view("course_application_modal", async ({ ack, body, view, context }) => {
  // Acknowledge the view_submission event
  await ack();
  console.log("course booking submitted");
  // build API call args into private metadata
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
    console.error(error);
  }

  const metadata = {
    id: course_id,
    name: body.user.real_name,
    email: body.user.email,
    user: body.user,
    user_id: body.user.id
  };
  // API add to waitlist
  // Calendar API call - user.name, user.id, user.email
  var res;
  try {
    res = await calendarAPI.requestApproval(metadata);
    //return res;
  } catch (error) {
    //console.error(error);
    console.log("approval already requested");
  }
  //console.log(res.text);

  // get EPM email from modal
  let values = view.state.values;
  let v = Object.entries(values);
  v = v[0][1];
  v = Object.values(v);
  let EPMname = v[0]["selected_option"]["value"];
  // get email from name
  const EPMtable = {
    Zoe: "zoe.osorio@gmail.com",
    Tristan: "tristan.plet@ibm.com",
    Johnny: "johnny.murphy@ibm.com"
  };
  const getEPMemail = state => EPMtable[state] || EPMname;
  let EPMemail = getEPMemail(EPMname);

  // get EPM slack ID from EPM email
  var EPMuser = "";
  try {
    const result = await app.client.users.lookupByEmail({
      token: context.botToken,
      email: EPMemail
    });
    //console.log(result)
    EPMuser = result["user"]["id"];
    //console.log(result["user"]["name"])
  } catch (error) {
    console.error(error);
  }

  //send a message to EPM, metadata in button value
  try {
    let blocks = await slackViews.requestApproval(metadata);
    blocks = JSON.parse(blocks);
    blocks[2].elements[0].value = JSON.stringify(metadata);
    blocks[2].elements[1].value = JSON.stringify(metadata);
    await app.client.chat.postMessage({
      token: context.botToken,
      channel: EPMuser,
      //callback_id:"EPM_approval",
      blocks: blocks
    });
  } catch (error) {
    console.error(error);
  }
});

// Handle EPM response
app.action(/EPM_.*/, async ({ body, ack, say }) => {
  try {
    // Acknowledge the action
    await ack();
    //console.log("EPM response");
    let metadata = body["actions"][0]["value"];
    // switch case
    switch (body["actions"][0]["action_id"]) {
      case "EPM_approve":
        // code block
        console.log("approve");
        metadata.response="approved";
        // API add to waitlist
        // Calendar API call - user.name, user.id, user.email
        var res;
        try {
          res = await calendarAPI.ApproveUser(metadata);
          //return res;
        } catch (error) {
          //console.error(error);
          console.log("approve user API fail");
        }
        await say("Request has been approved.");
        break;
      case "EPM_deny":
        // code block
        console.log("deny");
        metadata.response="denied";
        // API add to waitlist
        // Calendar API call - user.name, user.id, user.email
        var res;
        try {
          res = await calendarAPI.rejectUser(metadata);
          //return res;
        } catch (error) {
          //console.error(error);
          console.log("user rejection failed");
        }

        await say("Request has been denied.");
        break;
      default:
      // code block
    }
  // } catch (error) {
  //   console.error(error);
  
  
  // Send approval/rejection message to user
    console.log(metadata);
    let blocks = await slackViews.requestResponse(metadata);
    blocks = JSON.parse(blocks);
    await app.client.chat.postMessage({
      token: app.token,
      channel: metadata.user_id,
      blocks: blocks
    });
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
