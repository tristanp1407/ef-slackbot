const axios = require("axios");
const qs = require("qs");
const apiUrl = "https://slack.com/api";
const calendarUrl = "https://foundation-calendar.eu-gb.mybluemix.net/api";


const getEPMemail = async user => {
  let url =
    "https://w3-services1.w3-969.ibm.com/myw3/unified-profile/v2/docs/instances/masterByEmail?email=johnny.murphy@ibm.com";
  const res = await axios
    .get(url)
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
  console.log(res);

  return res;
};

const requestApproval = async metadata => {
  const url =
    "https://foundation-calendar.eu-gb.mybluemix.net/api/event/requestApproval";
    let requestBody = {
      id: metadata.id,
      email: metadata.email,
      name: metadata.name
  }
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
  const url =
    "https://foundation-calendar.eu-gb.mybluemix.net/api/event/rejectUser";
  let requestBody = {
      id: metadata.id,
      email: metadata.email,
      name: metadata.name
  }
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

const ApproveUser = async metadata => {
  const url =
    "https://foundation-calendar.eu-gb.mybluemix.net/api/event/ApproveUser";
    let requestBody = {
      id: metadata.id,
      email: metadata.email,
      name: metadata.name
  }
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

const getMyCourses = async (userEmail) => {

  let requestBody = {
    email: userEmail
  }

  const res = await axios
    .post(`${calendarUrl}/event/myEvents`, requestBody)
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
  return res;
};

module.exports = {requestApproval, rejectUser, ApproveUser, getMyCourses };
