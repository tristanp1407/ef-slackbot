const axios = require("axios");
const qs = require("qs");
const moment = require('moment');

const apiUrl = "https://slack.com/api";
const calendarUrl = "https://foundation-calendar.eu-gb.mybluemix.net/api";
const calendarAPI = require("./calendarAPI");


const requestResponse = async metadata => {
  // let blocks = {
  //   "blocks": [
  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Your request to send attend the following course has been $response."
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "*Course name:*\n$title"
        },
        {
          type: "mrkdwn",
          text: "*Price:*\n$price"
        },
        {
          type: "mrkdwn",
          text: "*Location*\n$location"
        },
        {
          type: "mrkdwn",
          text: "*Date:*\n$date"
        }
        // {
        //   type: "mrkdwn",
        //   text: "*Description:*\n$description"
        // }
      ]
    }
  ];
  // const found = array1.find(element => element > 10);
  // Calendar API call
  const res = await axios
    .get(`${calendarUrl}/events`)
    .then(function(response) {
      // handle success
      //console.log(response.data);
      return response;
    })
    .catch(function(error) {
      // handle error
      console.log(error);
      throw error;
    });
  // .finally(function() {
  //   // always executed
  // });
  //console.log(res);
  var courses = res.data.rows;
  let course = courses.find(element => element._id == metadata.course_id);
  blocks = JSON.stringify(blocks);
  blocks = blocks.replace("$title", course.doc.title);
  blocks = blocks.replace("$location", course.doc.location);
  blocks = blocks.replace("$price", course.doc.price);
  blocks = blocks.replace("$date", course.doc.start);
  blocks = blocks.replace("$response", metadata.response);
  //blocks=blocks.replace("$decription", course.doc.url);
  blocks = blocks.replace("$name", metadata.name);
  return blocks;
};

const requestApproval = async metadata => {
  // let blocks = {
  //   "blocks": [
  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*You have a new request:*\n$name has made an approval request"
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "*Course name:*\n$title"
        },
        {
          type: "mrkdwn",
          text: "*Price:*\n$price"
        },
        {
          type: "mrkdwn",
          text: "*Location*\n$location"
        },
        {
          type: "mrkdwn",
          text: "*Date:*\n$date"
        },
        {
          type: "mrkdwn",
          text: "*Description:*\n$description"
        }
      ]
    },
    {
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
          action_id: "EPM_approve"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Deny"
          },
          style: "danger",
          action_id: "EPM_deny"
        }
      ]
    }
  ];
  // const found = array1.find(element => element > 10);
  // Calendar API call
  const res = await axios
    .get(`${calendarUrl}/events`)
    .then(function(response) {
      // handle success
      //console.log(response.data);
      return response;
    })
    .catch(function(error) {
      // handle error
      console.log(error);
      throw error;
    });
  // .finally(function() {
  //   // always executed
  // });
  //console.log(res);
  var courses = res.data.rows;
  let course = courses.find(element => element._id == metadata.course_id);
  blocks = JSON.stringify(blocks);
  blocks = blocks.replace("$title", course.doc.title);
  blocks = blocks.replace("$location", course.doc.location);
  blocks = blocks.replace("$price", course.doc.price);
  blocks = blocks.replace("$date", course.doc.start);
  blocks = blocks.replace("$description", course.doc.url);
  blocks = blocks.replace("$name", metadata.name);
  return blocks;
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
            "Before requesting approval from your Foundation manager to attend this course, you must gain your task manager's approval. By clicking the checkbox below, you are confirming that your task manager has agreed to give you the time and funding to attend this course. \n\n $course_details"
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
                  text: "I have my task manager's approval to attend this course"
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

// View to let user book course
const bookCourse2 = async user => {
  let modal = {
    type: "modal",
    callback_id: "course_application_modal",
    title: {
      type: "plain_text",
      text: "My App",
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
            "Select your EPM. When you submit this request, you will be added to the waitlist and a message will be sent to your EPM requesting approval. We'll let you know whether your EPM approves the request - if you havent recieved a message in 2 days, follow up with your EPM.",
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
          options: [
            {
              value: "Zoe",
              text: {
                type: "plain_text",
                text: "Zoe",
                emoji: true
              }
            },
            {
              value: "Johnny",
              text: {
                type: "plain_text",
                text: "Johnny",
                emoji: true
              }
            },
            {
              value: "Tristan",
              text: {
                type: "plain_text",
                text: "Tristan",
                emoji: true
              }
            }
          ]
        },
        label: {
          type: "plain_text",
          text: "Select your EPM from the dropdown list",
          emoji: true
        }
      }
    ]
  };

  return JSON.stringify(modal);
};

const viewCourses = async userEmail => {

  
  //calculate number of courses assiciated with user email
  let numberOfCoursesAttending;
  try {
    var response = await calendarAPI.getMyCourses(userEmail);
    numberOfCoursesAttending = response.data.rows.length;
    // console.log(numberOfCoursesAttending)
  } catch (error) {
    console.error(error);
  }

  let blocks = [
    //header with button to view your courses -
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:thumbsup:  *You have ${numberOfCoursesAttending} course applications*`
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
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*$title*  \n$description"
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Book course",
					"emoji": true
				},
				"action_id": "book_course_1_<id>"
			}
		},
		{
			"type": "context",
			"elements": [
				{
					"type": "mrkdwn",
					"text": "$location"
				},
				{
					"type": "mrkdwn",
					"text": "|"
				},
				{
					"type": "mrkdwn",
					"text": "$date"
				},
        {
					"type": "mrkdwn",
					"text": "|"
				},
				{
					"type": "mrkdwn",
					"text": "$startTime  -  $endTime"
				}
			]
		},
		{
			"type": "divider"
		}
  ];

  // Calendar API call
  const res = await axios
    .get(`${calendarUrl}/events`)
    .then(function(response) {
      // handle success
      //console.log(response.data);
      return response;
    })
    .catch(function(error) {
      // handle error
      console.log(error);
      throw error;
    });
  // .finally(function() {
  //   // always executed
  // });
  //console.log(res);
  var courses = res.data.rows;
  let len = courses.length;
  var i, course, courseBlock, text, locationText, timeText, dateText
  // for each course in the list of courses
  for (i = 0; i < len; i++) {
    course = courses[i].doc;
    //console.log(course);
    // create course blocks from the course block template and update with the values for the course
    //const courseBlock = Array.from(courseBlockTemplate);
    //var courseBlock=courseBlockTemplate.slice(0);
    courseBlock = JSON.parse(JSON.stringify(courseBlockTemplate)); // use lodash? const lodashClonedeep = require("lodash.clonedeep");
    // update the tmeplate with the course details
    text = courseBlock[0].text.text;
    locationText = courseBlock[1].elements[0].text
    timeText = courseBlock[1].elements[4].text
    dateText = courseBlock[1].elements[2].text
    
    //converts ISO date format to string using moment js
    let courseDate = moment(course.start).format('dddd, ll')
    console.log(courseDate)
    
    text = text.replace("$title", course.title);  
    text = text.replace("$description", course.desc);
    locationText = locationText.replace("$location", course.location);
    dateText = dateText.replace("$date", courseDate);
    timeText = timeText.replace("$startTime", course.startTime);
    timeText = timeText.replace("$endTime", course.endTime);
    
  
    //text = text.replace("$numSpaces", "?");
    
    
    courseBlock[0].text.text = text;
    courseBlock[1].elements[0].text = locationText;
    courseBlock[1].elements[4].text = timeText;
    courseBlock[1].elements[2].text = dateText
  
    courseBlock[0].accessory.action_id = courseBlock[0].accessory.action_id.replace(
      "<id>",
      course._id
    );
    
    // courseBlock[0].accessory.options[1].value = courseBlock[0].accessory.options[1].value.replace(
    //   "$title",
    //   course.title
    // );
    //console.log(courseBlock);
    // add the course block to our list of blocks
    blocks = blocks.concat(courseBlock);
  }

  let view = {
    type: "home",
    title: {
      type: "plain_text",
      text: "Foundation Courses"
    },
    blocks: blocks
  };
  // return slack view and course list API response
  return JSON.stringify(view);
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
        text:
          "*$title*   ($attendingStatus) \n$description"
      },
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
					"type": "mrkdwn",
					"text": "$date"
				},
        {
					"type": "mrkdwn",
					"text": "|"
				},
				{
					"type": "mrkdwn",
					"text": "$startTime  -  $endTime"
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

  const res = await axios
    .post(`${calendarUrl}/event/myEvents`, email)
    .then(function(response) {
      // handle success
      //console.log(response.data);
      return response;
    })
    .catch(function(error) {
      // handle error
      console.log(error);
      throw error;
    });

  var courses = res.data.rows;
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
    dateText
  // for each course in the list of courses
  for (i = 0; i < len; i++) {
    course = courses[i];
    // console.log(courseB);
    // create course blocks from the course block template and update with the values for the course
    //const courseBlock = Array.from(courseBlockTemplate);
    //var courseBlock=courseBlockTemplate.slice(0);
    courseBlock = JSON.parse(JSON.stringify(myCoursesList));
    // use lodash? const lodashClonedeep = require("lodash.clonedeep");
    // update the tmeplate with the course details

    const getAttendingStatus = () => {
      if (course.currentStatus == "Awaiting approval") {
        return (currentStatus = "Awaiting Approval :hourglass_flowing_sand:");
      } 
      else if (course.currentStatus == "Rejected") {
        return (currentStatus = "Attendance Denied :x:");
      }
      else if (course.currentStatus == "On Waitlist") {
        return (currentStatus = "On Waiting List :stopwatch:");
      }
      else{
        return (currentStatus = "Attendance Approved :heavy_check_mark:");
      }
    };

    getAttendingStatus();

    titleText = courseBlock[0].text.text;
    descriptionText = courseBlock[0].text.text
    locationText = courseBlock[1].elements[0].text;
    timeText = courseBlock[1].elements[4].text;
    statusText = courseBlock[0].text.text;
    dateText = courseBlock[1].elements[2].text
    
    //converts ISO date format to string using moment js
    let courseDate = moment(course.start).format('dddd, ll')
    console.log(courseDate)
    

    titleText = titleText.replace("$title", course.doc.title);
    titleText = titleText.replace("$attendingStatus", currentStatus);
    titleText = titleText.replace("$description", course.doc.desc)
    locationText = locationText.replace("$location", course.doc.location);
    dateText = dateText.replace("$date", courseDate);
    timeText = timeText.replace("$startTime", course.doc.startTime);
    timeText = timeText.replace("$endTime", course.doc.endTime);

    // text = text.replace("$location", course.location);
    // text = text.replace("<num spaces>", "?");
    courseBlock[0].text.text = titleText;
    courseBlock[1].elements[0].text = locationText;
    courseBlock[1].elements[4].text = timeText;
    courseBlock[1].elements[2].text = dateText
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
  viewCourses,
  bookCourse1,
  bookCourse2,
  requestApproval,
  requestResponse,
  myCourses
};
