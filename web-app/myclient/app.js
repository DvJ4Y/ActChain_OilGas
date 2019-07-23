/* eslint-disable require-atomic-updates */
/*jshint esversion: 8 */
/* jshint node: true */
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const request = require('request');
const cookieParser = require('cookie-parser');


const app = express();
app.options('*', cors());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(cors());
app.set('view engine', 'ejs');
app.use('/assets', express.static(__dirname + '/assets'));
app.use(cookieParser());

// let options = {
//   method: 'post',
//   body: {},
//   json: true,
//   url: 'url',
// };



app.get('/profiles', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllUsers',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    res.render('profiles', { data: body });
  });
});

app.get('/logout', async (req, res) => {
  res.clearCookie('userId');
  res.redirect('/profiles');
});

app.get('/', async (req, res) => {
  // let orgsdata = fs.readFileSync('../data/orgs.json','utf8');
  // let orgsjson = JSON.parse(orgsdata);
  // console.log(orgsjson);
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllUsers',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log('Body :', body);
    res.render('profiles', { data: body });
  });

});
app.get('/register', async (req, res) => {
  res.render('register');
});

// Admin Renders
app.get('/admindash', async (req, res) => {
  let options = {
    method: 'get',
    body: {
      key: req.cookies.userId
    }, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/queryAll',
  };
  console.log(options);
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);

    let reviewCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Key === req.cookies.userId && body[i].Record.receivedReviews) {
        reviewCount = body[i].Record.receivedReviews.length;
      }
    }

    let memberCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Record.entity === 'user') {
        memberCount++;
      }
    }
    let displayProjs = [];
    let projectCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Record.type === 'project' && body[i].Record.project.status !== 'Project Successfully Completed') {
        projectCount++;
        if (displayProjs.length < 4) {
          displayProjs.push(body[i]);
        }
      }
    }
    for (let i = 0; i < displayProjs.length; i++) {
      if (displayProjs[i].Record.project.status === 'Project Created'){
        displayProjs[i].percent = 10;
      }
      else if (displayProjs[i].Record.project.status === 'Project Assigned - Lead Contractor'){
        displayProjs[i].percent = 20;
      }
      else if (displayProjs[i].Record.project.status === 'In Progress - Lead Contractor'){
        displayProjs[i].percent = 30;
      }
      else if (displayProjs[i].Record.project.status === 'Project Assigned - Sub Contractor'){
        displayProjs[i].percent = 40;
      }
      else if (displayProjs[i].Record.project.status === 'In Progress - Sub Contractor'){
        displayProjs[i].percent = 50;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Lead Contractor'){
        displayProjs[i].percent = 60;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Project Owner'){
        displayProjs[i].percent = 70;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Inspection Service'){
        displayProjs[i].percent = 80;
      }
      else if (displayProjs[i].Record.project.status === 'Completed Inspection'){
        displayProjs[i].percent = 90;
      }
      else if (displayProjs[i].Record.project.status === 'Project Successfully Completed'){
        displayProjs[i].percent = 100;
      }

    }

    let data = {};
    data.reviewCount = reviewCount;
    data.memberCount = memberCount;
    data.projectCount = projectCount;
    data.displayProjs = displayProjs;
    data.color=[];
    data.color[0] = 'easypiechart-blue';
    data.color[1] = 'easypiechart-orange';
    data.color[2] = 'easypiechart-teal';
    data.color[3] = 'easypiechart-red';

    console.log('DISPLAY'+JSON.stringify(data.displayProjs, undefined, 2));
    res.render('admin/admindash', { data: data });
  });

});

app.get('/adminreviewsee', async (req, res) => {
  let options = {
    method: 'post',
    body: {
      query: 'review'
    }, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/queryWithQueryString',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let data = body;
    res.render('admin/adminreviewsee', { data: data });
  });
});

app.post('/adminreviewsee2', async (req, res) => {
  let options = {
    method: 'post',
    body: {
      key: req.body.query.toString()
    },
    json: true,
    url: 'http://127.0.0.1:8081/queryByKey',
  };
  console.log('OPTIONS ADMIN' + JSON.stringify(options.body));
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    } else {
      console.log('ADMINREVIEWSEE: ', body);
      let data = body;
      res.render('admin/adminreviewsee2', { data: data });
    }

  });
});

app.get('/admincreate', async (req, res) => {
  res.render('admin/admincreate');
});

app.get('/adminfinish', async (req, res) => {
  // let projdata = fs.readFileSync('../data/projects.json','utf8');
  // let projjson = JSON.parse(projdata);
  // console.log(projjson);
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllInspections',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      res.render('admin/adminfinish', { data: body, dataproj: bodyproj });
    });
  });
});

app.get('/adminend', async (req, res) => {
  // let projdata = fs.readFileSync('../data/projects.json','utf8');
  // let projjson = JSON.parse(projdata);
  // console.log(projjson);
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllProjects',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);

    res.render('admin/adminend', { data: body});
  });
});

app.get('/adminreview', async (req, res) => {

  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllContractors',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      res.render('admin/adminreview', { data: body, dataproj: bodyproj });
    });
  });
});

app.get('/adminassign', async (req, res) => {
  // let orgsdata = fs.readFileSync('../data/orgs.json','utf8');
  // let orgsjson = JSON.parse(orgsdata);
  // console.log(orgsjson);
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllContractors',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      res.render('admin/adminassign', { data: body, dataproj: bodyproj });
    });
  });
  // let projdata = fs.readFileSync('../data/projects.json','utf8');
  // let projjson = JSON.parse(projdata);
  // console.log(projjson);
  // res.render('admin/adminassign',{data: orgsjson, project: projjson});
});

app.get('/logout', async (req, res) => {

});

app.get('/adminproject', async (req, res) => {
  // let projdata = fs.readFileSync('../data/projects.json','utf8');
  // let projjson = JSON.parse(projdata);
  // console.log(projjson);

  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllProjects',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    res.render('admin/adminproject', { data: body });
  });
});

app.post('/adminproject2', async (req, res) => {
  let options = {
    method: 'get',
    body: {},
    json: true,
    url: 'http://127.0.0.1:8081/getAllProjects',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }

    let data = {};
    for (let i = 0; i < body.length; i++) {
      if (body[i].Key === req.body.projectId) {
        console.log(' Body :', body[i]);
        data.project = body[i].Record;
      }
    }
    res.render('admin/adminproject2', { data: data});

  });
});
app.get('/adminassigntask', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllContractors',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' data :', body);
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      res.render('admin/adminassigntask', { data : body, dataproj: bodyproj });
    });
  });
});

// Inspection Renders
app.get('/inspectionreviewsee', async (req, res) => {
  let options = {
    method: 'post',
    body: {
      query: 'review'
    }, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/queryWithQueryString',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let data = body;
    res.render('inspection/inspectionreviewsee', { data: data });
  });
});

app.post('/inspectionreviewsee2', async (req, res) => {
  let options = {
    method: 'post',
    body: {
      key: req.body.query.toString()
    },
    json: true,
    url: 'http://127.0.0.1:8081/queryByKey',
  };
  console.log('OPTIONS ADMIN' + JSON.stringify(options.body));
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    } else {
      console.log('ADMINREVIEWSEE: ', body);
      let data = body;
      res.render('inspection/inspectionreviewsee2', { data: data });
    }

  });
});

app.get('/inspectiondash', async (req, res) => {
  let options = {
    method: 'get',
    body: {
      key: req.cookies.userId
    }, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/queryAll',
  };
  console.log(options);
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);

    let reviewCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Key === req.cookies.userId && body[i].Record.receivedReviews) {
        reviewCount = body[i].Record.receivedReviews.length;
      }
    }

    let memberCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Record.entity === 'user') {
        memberCount++;
      }
    }
    let displayProjs = [];
    let projectCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Record.type === 'project' && body[i].Record.project.status !== 'Project Successfully Completed') {
        projectCount++;
        if (displayProjs.length < 5) {
          displayProjs.push(body[i]);
        }
      }
    }
    for (let i = 0; i < displayProjs.length; i++) {
      if (displayProjs[i].Record.project.status === 'Project Created'){
        displayProjs[i].percent = 10;
      }
      else if (displayProjs[i].Record.project.status === 'Project Assigned - Lead Contractor'){
        displayProjs[i].percent = 20;
      }
      else if (displayProjs[i].Record.project.status === 'In Progress - Lead Contractor'){
        displayProjs[i].percent = 30;
      }
      else if (displayProjs[i].Record.project.status === 'Project Assigned - Sub Contractor'){
        displayProjs[i].percent = 40;
      }
      else if (displayProjs[i].Record.project.status === 'In Progress - Sub Contractor'){
        displayProjs[i].percent = 50;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Lead Contractor'){
        displayProjs[i].percent = 60;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Project Owner'){
        displayProjs[i].percent = 70;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Inspection Service'){
        displayProjs[i].percent = 80;
      }
      else if (displayProjs[i].Record.project.status === 'Completed Inspection'){
        displayProjs[i].percent = 90;
      }
      else if (displayProjs[i].Record.project.status === 'Project Successfully Completed'){
        displayProjs[i].percent = 100;
      }

    }

    let data = {};
    data.reviewCount = reviewCount;
    data.memberCount = memberCount;
    data.projectCount = projectCount;
    data.displayProjs = displayProjs;

    console.log('DISPLAY'+JSON.stringify(data.displayProjs, undefined, 2));
    res.render('inspection/inspectiondash', { data: data });
  });

});

app.get('/inspectionproject', async (req, res) => {
  // let projdata = fs.readFileSync('../data/projects.json','utf8');
  // let projjson = JSON.parse(projdata);
  // console.log(projjson);

  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllProjects',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    res.render('inspection/inspectionproject', { data: body });
  });
});

app.post('/inspectionproject2', async (req, res) => {
  let options = {
    method: 'get',
    body: {},
    json: true,
    url: 'http://127.0.0.1:8081/getAllProjects',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }


    for (let i = 0; i < body.length; i++) {
      if (body[i].Key === req.body.projectId) {
        console.log(' Body :', body[i]);
        res.render('inspection/inspectionproject2', { data: body[i] });
      }
    }


  });
});

app.get('/inspectionfinish', async (req, res) => {
  // let projdata = fs.readFileSync('../data/projects.json','utf8');
  // let projjson = JSON.parse(projdata);
  // console.log(projjson);
  let options = {
    method: 'post',
    body: {
      key: req.cookies.userId
    }, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/queryByKey',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    res.render('inspection/inspectionfinish', { data: body });
  });
});


app.get('/inspectionreview', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllProjectOwners',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let data = body;
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      let dataproj = bodyproj;
      res.render('inspection/inspectionreview', { data: data, dataproj: dataproj });
    });
  });
});

app.get('/contractorreview', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllContractors',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let data = body;
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      let dataproj = bodyproj;
      res.render('contractor/contractorreview', { data: data, dataproj: dataproj });
    });
  });
});

app.get('/contractorreviewsee', async (req, res) => {
  let options = {
    method: 'post',
    body: {
      query: 'review'
    }, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/queryWithQueryString',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let data = body;
    res.render('contractor/contractorreviewsee', { data: data });
  });
});

app.post('/contractorreviewsee2', async (req, res) => {
  let options = {
    method: 'post',
    body: {
      key: req.body.query.toString()
    },
    json: true,
    url: 'http://127.0.0.1:8081/queryByKey',
  };
  console.log('OPTIONS ADMIN' + JSON.stringify(options.body));
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    } else {
      console.log('ADMINREVIEWSEE: ', body);
      let data = body;
      res.render('contractor/contractorreviewsee2', { data: data });
    }

  });
});
//  Contractor Renders


app.get('/contractordash', async (req, res) => {
  let options = {
    method: 'get',
    body: {
      key: req.cookies.userId
    }, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/queryAll',
  };
  console.log(options);
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);

    let reviewCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Key === req.cookies.userId && body[i].Record.receivedReviews) {
        reviewCount = body[i].Record.receivedReviews.length;
      }
    }

    let memberCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Record.entity === 'user') {
        memberCount++;
      }
    }
    let displayProjs = [];
    let projectCount = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i].Record.type === 'project' && body[i].Record.project.status !== 'Project Successfully Completed') {
        projectCount++;
        if (displayProjs.length < 5) {
          displayProjs.push(body[i]);
        }
      }
    }
    for (let i = 0; i < displayProjs.length; i++) {
      if (displayProjs[i].Record.project.status === 'Project Created'){
        displayProjs[i].percent = 10;
      }
      else if (displayProjs[i].Record.project.status === 'Project Assigned - Lead Contractor'){
        displayProjs[i].percent = 20;
      }
      else if (displayProjs[i].Record.project.status === 'In Progress - Lead Contractor'){
        displayProjs[i].percent = 30;
      }
      else if (displayProjs[i].Record.project.status === 'Project Assigned - Sub Contractor'){
        displayProjs[i].percent = 40;
      }
      else if (displayProjs[i].Record.project.status === 'In Progress - Sub Contractor'){
        displayProjs[i].percent = 50;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Lead Contractor'){
        displayProjs[i].percent = 60;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Project Owner'){
        displayProjs[i].percent = 70;
      }
      else if (displayProjs[i].Record.project.status === 'Under Review - Inspection Service'){
        displayProjs[i].percent = 80;
      }
      else if (displayProjs[i].Record.project.status === 'Completed Inspection'){
        displayProjs[i].percent = 90;
      }
      else if (displayProjs[i].Record.project.status === 'Project Successfully Completed'){
        displayProjs[i].percent = 100;
      }

    }

    let data = {};
    data.reviewCount = reviewCount;
    data.memberCount = memberCount;
    data.projectCount = projectCount;
    data.displayProjs = displayProjs;

    console.log('DISPLAY'+JSON.stringify(data.displayProjs, undefined, 2));
    res.render('contractor/contractordash', { data: data });
  });

});

app.get('/contractorassign', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllContractors',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      res.render('contractor/contractorassign', { data: body, dataproj: bodyproj });
    });
  });
});

app.get('/contractorfinish', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllProjects',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    res.render('contractor/contractorfinish', { data: body });
  });
});

app.get('/contractorreview', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllContractors',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let data = body;
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      let dataproj = bodyproj;
      res.render('contractor/contractorreview', { data: data, dataproj: dataproj });
    });
  });
});

app.get('/contractorproject', async (req, res) => {
  // let projdata = fs.readFileSync('../data/projects.json','utf8');
  // let projjson = JSON.parse(projdata);
  // console.log(projjson);

  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllProjects',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    res.render('contractor/contractorproject', { data: body });
  });
});

app.post('/contractorproject2', async (req, res) => {
  let options = {
    method: 'get',
    body: {},
    json: true,
    url: 'http://127.0.0.1:8081/getAllProjects',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }


    for (let i = 0; i < body.length; i++) {
      if (body[i].Key === req.body.projectId) {
        console.log(' Body :', body[i]);
        res.render('contractor/contractorproject2', { data: body[i] });
      }
    }


  });
});

app.get('/contractoradd', async (req, res) => {
  res.render('contractor/contractoradd');
});

app.get('/contractorassigntask', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllTasks',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' data :', body);
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      res.render('contractor/contractorassigntask', { data: body, dataproj: bodyproj });
    });
  });
});

app.get('/contractorcompletesub', async (req, res) => {
  let options = {
    method: 'get',
    body: {}, // Javascript object
    json: true, // Use,If you are sending JSON data
    url: 'http://127.0.0.1:8081/getAllTasks',
  };
  request(options, function (err, response, body) {
    if (err) {
      console.log('Error :', err);
      res.send(err);
    }
    console.log(' Body :', body);
    let data = body;
    let options = {
      method: 'get',
      body: {}, // Javascript object
      json: true, // Use,If you are sending JSON data
      url: 'http://127.0.0.1:8081/getAllProjects',
    };
    request(options, function (err, response, bodyproj) {
      if (err) {
        console.log('Error :', err);
        res.send(err);
      }
      console.log(' Bodyproj :', bodyproj);
      let dataproj = bodyproj;
      res.render('contractor/contractorcompletesub', { data: data, dataproj: dataproj });
    });
  });
});

app.listen(process.env.PORT || 3000);
console.log('PORT: ', process.env.PORT, 'Or 3000');