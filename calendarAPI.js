const axios = require("axios");
const apiUrl = "https://slack.com/api";
const calendarUrl = "https://foundation-calendar.eu-gb.mybluemix.net/api";
const moment = require("moment");

// formats API response 
const formattedRes = res => {
  // format time string
  // console.log(res.data.rows);
  var courses = res.data.rows;
  let len = courses.length;
  var i, course, courseDate, externalLink;
  // for each course in the list of courses
  for (i = 0; i < len; i++) {
    course = courses[i].doc;

    //converts ISO date format to string using moment js
    //let startDate = moment(course.start).format("DD/MM/YYYY");
    course.start = moment(course.start).format("DD/MM/YYYY");

    // let endDate = moment(course.end).format("DD/MM/YYYY");
    course.end = moment(course.end).format("DD/MM/YYYY");

    const createDateString = () => {
      if (course.start !== course.end) {
        return (courseDate = course.start + " - " + course.end);
      } else {
        return (courseDate = course.start);
      }
    };

    createDateString();
    course.courseDate = courseDate;

    const renderLink = () => {
      if (course.url == "") {
        return (externalLink = " ");
      } else {
        return (externalLink = `Click <${course.url}|here> to read more.`);
      }
    };

    renderLink();

    course.externalLink = externalLink;

    courses[i].doc = course;
  }
  // update API result course list
  res.data.rows = courses;
  // course.start, course.end, coure.date, course.link
  return res;
};


const requestApproval = async metadata => {
  const url =
    "https://foundation-calendar.eu-gb.mybluemix.net/api/event/requestApproval";
  let requestBody = {
    id: metadata.id,
    email: metadata.email,
    name: metadata.name
  };
  const res = await axios
    .put(url, requestBody)
    .then(function(response) {
      // handle success
      //console.log(response.data);
      return response;
    })
    .catch(function(error) {
      // handle error
      //console.log(error);
      throw error;
    });
  return res;
};

const rejectUser = async metadata => {
  let requestBody = {
    id: metadata.id,
    email: metadata.email,
    name: metadata.name
  };
  const res = await axios
    .put(`${calendarUrl}/event/rejectUser`, requestBody)
    .then(function(response) {
      // handle success
      //console.log(response.data);
      return response;
    })
    .catch(function(error) {
      // handle error
      //console.log(error);
      //console.log(error.response.data.error);
      throw error;
    });
  return res;
};

const ApproveUser = async metadata => {
  let requestBody = {
    id: metadata.id,
    email: metadata.email,
    name: metadata.name
  };
  const res = await axios
    .put(`${calendarUrl}/event/ApproveUser`, requestBody)
    .then(function(response) {
      // handle success
      //console.log(response.data);
      return response;
    })
    .catch(function(error) {
      // handle error
      //console.log(error);
      throw error;
    });
  return res;
};

const allEvents = async a => {
  let res = axios
    .post(`${calendarUrl}/allEvents`)
    .then(function(res) {
      // handle success
      res = formattedRes(res);
      // console.log("calendarAPI:128:  ", res.data.rows[0]);
      return res
    })
    .catch(function(error) {
      // handle error
      //console.log(error);
      throw error;
    });

  
  // res = await formattedRes(res);
  return res;
};


// version which formats date strings
const getMyCourses = async userEmail => {  
  let res = await axios
    .post(`${calendarUrl}/event/myEvents`, userEmail)
    .then(function(res) {
      // format res
      res = formattedRes(res);
      return res;
    })
    .catch(function(error) {
      // handle error
      throw error;
      console.log("getMyCourses  API fail")
    });
  
  // console.log("calendarAPI:161   ",res.data.rows)
  return res;
};




module.exports = { requestApproval, rejectUser, ApproveUser, getMyCourses, allEvents};

// const getEPMemail = async user => {
//   let url =
//     "https://w3-services1.w3-969.ibm.com/myw3/unified-profile/v2/docs/instances/masterByEmail?email=johnny.murphy@ibm.com";
//   const res = await axios
//     .get(url)
//     .then(function(response) {
//       // handle success
//       //console.log(response.data);
//       return response;
//     })
//     .catch(function(error) {
//       // handle error
//       console.log(error);
//       throw error;
//     });
//   console.log(res);

//   return res;
// };
