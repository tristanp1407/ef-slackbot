const axios = require("axios");
const moment = require("moment");
const foundation_managers = require("./foundation_managers");
const apiUrl = "https://slack.com/api";
const calendarUrl = "https://foundation-calendar.eu-gb.mybluemix.net/api";
const calendarAPI = require("./calendarAPI");

const getManagerEmail = async manager_name => {
  // get email from name
  const manager_table = foundation_managers.managers;
  const getmanager_email = state => manager_table[state] || manager_name;
  let manager_email = getmanager_email(manager_name);
  return manager_email;
};

// accepts course id, returns block with details
const getCourseDetailBlock = async course_id => {
  try {
    //console.log("getCourseDetailBlock ", course_id);
    var courseBlock,
      text,
      locationText,
      timeText,
      dateText,
      linkText,
      courseDate,
      externalLink;

    let blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*$title*  \n$description"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "$externalLink"
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "$location"
          },
          {
            type: "mrkdwn",
            text: "|"
          },
          {
            type: "mrkdwn",
            text: "$date"
          },
          {
            type: "mrkdwn",
            text: "|"
          },
          {
            type: "mrkdwn",
            text: "$startTime  -  $endTime"
          }
        ]
      }
    ];

    blocks = JSON.stringify(blocks);

    // Calendar API call
    const res = await axios
      .post(`${calendarUrl}/allEvents`)
      .then(function(response) {
        // handle success
        return response;
      })
      .catch(function(error) {
        // handle error
        console.log("allEvents api call fail");
        throw error;
      });
    // .finally(function() {
    //   // always executed
    // });
    //console.log(res);
    let courses = res.data.rows;

    let course = courses.find(element => element.id == course_id);
    course = course.doc;
    //converts ISO date format to string using moment js
    let startDate = moment(course.start).format("DD/MM/YYYY");
    let endDate = moment(course.end).format("DD/MM/YYYY");

    const createDateString = () => {
      if (startDate !== endDate) {
        return (courseDate = startDate + " - " + endDate);
      } else {
        return (courseDate = startDate);
      }
    };

    createDateString();

    const renderLink = () => {
      if (course.url == "") {
        return (externalLink = " ");
      } else {
        return (externalLink = `Click <${course.url}|here> to read more.`);
      }
    };

    renderLink();

    //blocks=blocks.replace("$decription", course.url);
    blocks = blocks.replace("$title", course.title);
    blocks = blocks.replace("$description", course.desc);
    blocks = blocks.replace("$location", course.location);
    blocks = blocks.replace("$date", courseDate);
    blocks = blocks.replace("$startTime", course.startTime);
    blocks = blocks.replace("$endTime", course.endTime);
    blocks = blocks.replace("$externalLink", externalLink);

    //let block = JSON.parse(blocks);
    return blocks;
  } catch (error) {
    console.log("Get course detail block build failed");
    console.error(error);
  }
};

const updateRequest = async metadata => {
  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "You have *$response* $name's request to attend the following course:"
        //text: `*You have a new request:*\n<@${metadata.name}> has made an approval request`
      }
    }
  ];
  let courseDetailBlock = await getCourseDetailBlock(metadata.id);
  blocks = blocks.concat(JSON.parse(courseDetailBlock));
  blocks = JSON.stringify(blocks);
  blocks = blocks.replace("$name", metadata.name);
  blocks = blocks.replace("$response", metadata.response);
  return blocks;
};

const requestResponse = async metadata => {
  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "Your request to attend the following course has been *$response.*"
      }
    }
  ];
  let courseDetailBlock = await getCourseDetailBlock(metadata.id);
  blocks = blocks.concat(JSON.parse(courseDetailBlock));
  blocks = JSON.stringify(blocks);
  blocks = blocks.replace("$response", metadata.response);
  return blocks;
};

const requestApproval = async metadata => {
  try {
    let blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*You have a new request:*\n$name has made an approval request"
          //text: `*You have a new request:*\n<@${metadata.name}> has made an approval request`
        }
      }
    ];
    let courseDetailBlock = await getCourseDetailBlock(metadata.id);
    blocks = blocks.concat(JSON.parse(courseDetailBlock));
    // append response buttons
    blocks = blocks.concat({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Approve"
          },
          style: "primary",
          action_id: "manager_approve"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Deny"
          },
          style: "danger",
          action_id: "manager_deny"
        }
      ]
    });
    blocks = JSON.stringify(blocks);
    blocks = blocks.replace("$name", metadata.name);
    return blocks;
  } catch (error) {
    console.log("Manager req approval message building failed");
    console.error(error);
  }
};

// View to check manager approval
const bookCourse1 = async course_id => {
  let modal = {
    type: "modal",
    callback_id: "book_course_2",
    // "submit": {
    // 	"type": "plain_text",
    // 	"text": "Submit",
    // 	"emoji": true
    // },
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true
    },
    title: {
      type: "plain_text",
      text: "Notification settings",
      emoji: true
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "Before requesting approval from your Foundation manager to attend this course, you must gain task manager approval. By clicking the checkbox below, you are confirming that your task manager has agreed to give you the time and funding to attend this course..\n"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "checkboxes",
            action_id: "manager_approval",
            options: [
              {
                text: {
                  type: "plain_text",
                  text:
                    "I have my Task Manager's approval to attend this course"
                },
                value: "approval",
                description: {
                  type: "plain_text",
                  text: " "
                }
              }
            ]
          }
        ]
      }
    ]
  };

  return JSON.stringify(modal);
};

// View to let user select manager
const bookCourse2 = async user => {
  let options = [];
  for (const manager in foundation_managers.managers) {
    let option = {
      value: manager,
      text: {
        type: "plain_text",
        text: manager,
        emoji: true
      }
    };
    options = options.concat(option);
  }

  let modal = {
    type: "modal",
    callback_id: "course_application_modal",
    title: {
      type: "plain_text",
      text: "Course booking",
      emoji: true
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true
    },
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true
    },
    blocks: [
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "plain_text",
          text:
            "Select your Foundation Manager.\nWhen you submit this request, you will be added to the course waitlist and a message will be sent to your Foundation Manager requesting approval. \nWe'll let you know whether your Foundation Manager approves the request.",
          emoji: true
        }
      },
      {
        type: "input",
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "Select an item",
            emoji: true
          },
          options: options
        },
        label: {
          type: "plain_text",
          text: "Select your Foundation Manager from the dropdown list",
          emoji: true
        }
      }
    ]
  };

  return JSON.stringify(modal);
};

// View to check they are an intern
const wimbledon1 = async user => {
  let modal = {
    type: "modal",
    callback_id: "wimbledon2",
    // "submit": {
    // 	"type": "plain_text",
    // 	"text": "Submit",
    // 	"emoji": true
    // },
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true
    },
    title: {
      type: "plain_text",
      text: "Wimbledon application",
      emoji: true
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            "You must be an intern to apply to help out at Wimbledon. Before we move on with your application, please check the box below to confirm you are an intern.\n"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "checkboxes",
            action_id: "wimbledon_checkbox_1",
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "I am an intern"
                },
                value: "approval",
                description: {
                  type: "plain_text",
                  text: " "
                }
              }
            ]
          }
        ]
      }
    ]
  };
  return JSON.stringify(modal);
};

// Application form link entry + Foundation manager select
const wimbledon2 = async user => {
  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "Please download this <https://support.box.com|application form template> and fill it in.\n\n Enter the box link to your application form below. Make sure that the link is <https://support.box.com/hc/en-us/articles/360043696854-Inviting-Collaborators|accesible to your manager>!"
      }
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: "box_link_input-action"
      },
      label: {
        type: "plain_text",
        text: "Box link",
        emoji: true
      }
    }
  ];

  let options = [];
  for (const manager in foundation_managers.managers) {
    let option = {
      value: manager,
      text: {
        type: "plain_text",
        text: manager,
        emoji: true
      }
    };
    options = options.concat(option);
  }

  let blocks1 = [
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "plain_text",
        text:
          "Select your Foundation Manager.\nWhen you submit this request, you will be added to the course waitlist and a message will be sent to your Foundation Manager requesting approval. \nWe'll let you know whether your Foundation Manager approves the request.",
        emoji: true
      }
    },
    {
      type: "input",
      element: {
        type: "static_select",
        action_id: "manager_select",
        placeholder: {
          type: "plain_text",
          text: "Select an item",
          emoji: true
        },
        options: options
      },
      label: {
        type: "plain_text",
        text: "Select your Foundation Manager from the dropdown list",
        emoji: true
      }
    }
  ];
  blocks = blocks.concat(blocks1);
  let modal = {
    type: "modal",
    callback_id: "application_form_modal",
    title: {
      type: "plain_text",
      text: "Wimbledon application",
      emoji: true
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true
    },
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true
    },
    blocks: blocks
  };
  return JSON.stringify(modal);
};

const requestWimbledonApproval = async metadata => {
  try {
    let blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*You have a new request:*\n$name has made an approval request"
          //text: `*You have a new request:*\n<@${metadata.name}> has made an approval request`
        }
      }
    ];
    let courseDetailBlock = await getCourseDetailBlock(metadata.id);
    blocks = blocks.concat(JSON.parse(courseDetailBlock));
    // append response buttons
    blocks = blocks.concat({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Approve"
          },
          style: "primary",
          action_id: "manager_approve"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Deny"
          },
          style: "danger",
          action_id: "manager_deny"
        }
      ]
    });
    blocks = JSON.stringify(blocks);
    blocks = blocks.replace("$name", metadata.name);
    return blocks;
  } catch (error) {
    console.log("Manager req approval message building failed");
    console.error(error);
  }
};

const homePage = async user => {
  //calculate number of courses assiciated with user email
  var numberOfCoursesAttending;
  //creating request body
  let email = {
    email: user.profile.email
  };

  try {
    let response = await calendarAPI.getMyCourses(email);
    numberOfCoursesAttending = response.data.rows.length;
    console.log("Slackviews 552:  ", numberOfCoursesAttending);
  } catch (error) {
    console.error(error);
  }

  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*BookerBee the Course Concierge* \n\n\nThis Bot is for booking Essential Foundation courses which are for Foundation Apprentices and Graduates. Managers can also use the bot to approve and deny any booking requests from these early professionals."
      },
      accessory: {
        type: "image",
        image_url: "https://img.cloudygif.com/small/ccb0b44cd7ab0f04.gif",
        alt_text: "IBM BookerBee"
      }
    },
    {
      type: "divider"
    },
    //header with button to view your courses -
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:thumbsup:  *You have ${numberOfCoursesAttending} course applications* `
      },

      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "View My Courses",
          emoji: true
        },
        action_id: "view_my_courses"
      }
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Click this button to apply to Wimbledon :tennis: "
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Apply",
          emoji: true
        },
        action_id: "wimbledon_1"
      }
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Available Courses*"
      }
    },
    {
      type: "divider"
    }
  ];

  let courseBlockTemplate = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*$title*  \n$description"
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Book course",
          emoji: true
        },
        action_id: "book_course_1_<id>"
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "$externalLink"
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "$location"
        },
        {
          type: "mrkdwn",
          text: "|"
        },
        {
          type: "mrkdwn",
          text: "$date"
        },
        {
          type: "mrkdwn",
          text: "|"
        },
        {
          type: "mrkdwn",
          text: "$startTime  -  $endTime"
        }
      ]
    },
    {
      type: "divider"
    }
  ];

  var res;
  try {
    res = await calendarAPI.allEvents("a");
  } catch (error) {
    console.log("allEvents api funct fail");
  }

  var courses = res.data.rows;

  let len = courses.length;
  var i, course, courseBlock, text, locationText, timeText, dateText, linkText;
  //courseDate,
  //externalLink;

  // for each course in the list of courses
  for (i = 0; i < len; i++) {
    course = courses[i].doc;
    var re = new RegExp("/Wimbledon.*/.");

    // if not wimbledon course
    if (!re.test(course.title)) {
      // create course blocks from the course block template and update with the values for the course
      //const courseBlock = Array.from(courseBlockTemplate);
      //var courseBlock=courseBlockTemplate.slice(0);
      courseBlock = JSON.parse(JSON.stringify(courseBlockTemplate)); // use lodash? const lodashClonedeep = require("lodash.clonedeep");
      // update the tmeplate with the course details
      text = courseBlock[0].text.text;
      locationText = courseBlock[2].elements[0].text;
      timeText = courseBlock[2].elements[4].text;
      dateText = courseBlock[2].elements[2].text;
      linkText = courseBlock[1].text.text;

      //     //converts ISO date format to string using moment js
      //     let startDate = moment(course.start).format("DD/MM/YYYY");
      //     let endDate = moment(course.end).format("DD/MM/YYYY");

      //     const createDateString = () => {
      //       if (startDate !== endDate) {
      //         return (courseDate = startDate + " - " + endDate);
      //       } else {
      //         return (courseDate = startDate);
      //       }
      //     };

      //     createDateString();

      //     const renderLink = () => {
      //       if (course.url == "") {
      //         return (externalLink = " ");
      //       } else {
      //         return (externalLink = `Click <${course.url}|here> to read more.`);
      //       }
      //     };

      //     renderLink();

      // console.log("externalLink: ",externalLink);

      text = text.replace("$title", course.title);
      text = text.replace("$description", course.desc);
      locationText = locationText.replace("$location", course.location);
      //dateText = dateText.replace("$date", courseDate);
      dateText = dateText.replace("$date", course.courseDate);
      timeText = timeText.replace("$startTime", course.startTime); //startTime
      timeText = timeText.replace("$endTime", course.endTime);
      linkText = linkText.replace("$externalLink", course.externalLink);
      //linkText = linkText.replace("$externalLink", externalLink);

      courseBlock[0].text.text = text;
      courseBlock[2].elements[0].text = locationText;
      courseBlock[2].elements[4].text = timeText;
      courseBlock[2].elements[2].text = dateText;
      courseBlock[1].text.text = linkText;

      courseBlock[0].accessory.action_id = courseBlock[0].accessory.action_id.replace(
        "<id>",
        course._id
      );

      // courseBlock[0].accessory.options[1].value = courseBlock[0].accessory.options[1].value.replace(
      //   "$title",
      //   course.title
      // );

      // add the course block to our list of blocks
      blocks = blocks.concat(courseBlock);
    } else {
      console.log(course.title);
    }
  }

  let view = {
    type: "home",
    title: {
      type: "plain_text",
      text: "Foundation Courses"
    },
    blocks: blocks
  };
  // return slack view and number of courses current
  return { view: JSON.stringify(view), numCourses: numberOfCoursesAttending };
};

const myCourses = async user => {
  let blocks = [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: "Please contact Maddie Guard to cancel your attendance.",
        emoji: true
      }
    },
    {
      type: "divider"
    }
  ];

  let myCoursesList = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*$title* - $currentStatus \n$description"
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "$externalLink"
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "$location"
        },
        {
          type: "mrkdwn",
          text: "|"
        },
        {
          type: "mrkdwn",
          text: "$date"
        },
        {
          type: "mrkdwn",
          text: "|"
        },
        {
          type: "mrkdwn",
          text: "$startTime  -  $endTime"
        }
      ]
    },
    {
      type: "divider"
    }
  ];

  //creating request body
  let email = {
    email: user.user.email
  };

  try {
    var res = await calendarAPI.getMyCourses(email);
    // console.log(numberOfCoursesAttending)
  } catch (error) {
    console.log("get courses API fail");
    console.error(error);
  }

  // //const res = await calendarAPI.getMyCourses(email);
  // const res = await axios
  //   .post(`${calendarUrl}/event/myEvents`, email)
  //   .then(function(response) {
  //     // handle success
  //     //console.log(response.data);
  //     return response;
  //   })
  //   .catch(function(error) {
  //     // handle error
  //     console.log(error);
  //     throw error;
  //   });

  var courses = res.data.rows;

  console.log("slackViews:872    ", courses[0]);

  var len = courses.length;
  var i,
    course,
    courseBlock,
    titleText,
    locationText,
    timeText,
    currentStatus,
    statusText,
    descriptionText,
    dateText,
    courseDate,
    externalLink,
    linkText;
  // for each course in the list of courses
  for (i = 0; i < len; i++) {
    course = courses[i].doc;

    // create course blocks from the course block template and update with the values for the course
    //const courseBlock = Array.from(courseBlockTemplate);
    //var courseBlock=courseBlockTemplate.slice(0);
    courseBlock = JSON.parse(JSON.stringify(myCoursesList));
    // use lodash? const lodashClonedeep = require("lodash.clonedeep");
    // update the tmeplate with the course details

    const getAttendingStatus = () => {
      if (courses[i].currentStatus == "Awaiting approval") {
        return (currentStatus = "Awaiting Approval  :hourglass_flowing_sand:");
      } else if (courses[i].currentStatus == "Rejected") {
        return (currentStatus = "Attendance Denied  :x:");
      } else if (courses[i].currentStatus == "On Waitlist") {
        return (currentStatus = "On Waiting List  :stopwatch:");
      } else if (courses[i].currentStatus == "Attending") {
        return (currentStatus = "Attendance Confirmed  :white_check_mark:");
      } else {
        return (currentStatus = "Error: Attendance Unknown  :confused:");
      }
    };

    getAttendingStatus();

    titleText = courseBlock[0].text.text;
    descriptionText = courseBlock[0].text.text;
    locationText = courseBlock[2].elements[0].text;
    timeText = courseBlock[2].elements[4].text;
    statusText = courseBlock[0].text.text;
    dateText = courseBlock[2].elements[2].text;
    linkText = courseBlock[1].text.text;

    titleText = titleText.replace("$title", course.title);
    titleText = titleText.replace("$currentStatus", currentStatus);
    titleText = titleText.replace("$description", course.desc);
    locationText = locationText.replace("$location", course.location);
    dateText = dateText.replace("$date", course.courseDate);
    timeText = timeText.replace("$startTime", course.startTime);
    timeText = timeText.replace("$endTime", course.endTime);
    linkText = linkText.replace("$externalLink", course.externalLink);

    // text = text.replace("$location", course.location);
    // text = text.replace("<num spaces>", "?");
    courseBlock[0].text.text = titleText;
    courseBlock[2].elements[0].text = locationText;
    courseBlock[2].elements[4].text = timeText;
    courseBlock[2].elements[2].text = dateText;
    courseBlock[1].text.text = linkText;

    // courseBlock[0].text.text = statusText;

    // courseBlock[0].accessory.action_id = courseBlock[0].accessory.action_id.replace(
    //   "<id>",
    //   course._id
    // );

    // add the course block to our list of blocks
    blocks = blocks.concat(courseBlock);
  }

  let view = {
    type: "modal",

    title: {
      type: "plain_text",
      text: "Your Courses",
      emoji: true
    },
    blocks: blocks
  };

  return JSON.stringify(view);
};

module.exports = {
  homePage,
  bookCourse1,
  bookCourse2,
  wimbledon1,
  wimbledon2,
  requestWimbledonApproval,
  getManagerEmail,
  requestApproval,
  requestResponse,
  updateRequest,
  myCourses,
  getCourseDetailBlock
};
