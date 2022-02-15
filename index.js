const express = require('express');
const app = express();
const port = 3000;


// Available sections
const sections = {
  a: {
    name: `a`,
    start: `9:00 a.m.`,
    end: `12:00 p.m.`,
    limit: 20,
    left: 20,
    list: []
  },
  b: {
    name: `b`,
    start: `9:00 a.m.`,
    end: `12:00 p.m.`,
    limit: 25,
    left: 25,
    list: []
  },
  c: {
    name: `c`,
    start: `11:00 a.m.`,
    end: `3:00 p.m.`,
    limit: 15,
    left: 15,
    list: []
  }
};


// Middlewares

app.use(express.json());

// Check section
const checkSection = (req, res, next) => {
  const { section } = req.params;

  if (section < `a` || section > `c`)
    return next({ code: 404, msg: `not found section ${section}` });

  req.section = sections[section];
  next();
};

// Check student
const checkStudent = (req, res, next) => {
  const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const body = req.body;
  let msg = [];

  if (typeof body.name !== `string` || !body.name.length)
    msg.push(`not valid student name`);

  if (typeof body.id !== `number` || !Number.isInteger(body.id) || body.id < 0)
    msg.push(`not valid student identification`);

  if (typeof body.email !== `string` || !body.email.toLowerCase().match(regex))
    msg.push(`not valid student email`);

  if (msg.length)
    return next({ code: 400, msg: msg.join(`, `) });

  next();
};

// Find student
const findStudent = (req, res, next) => {
  const section = req.section;
  const student = section.list.find(({ id }) => id === parseFloat(req.params.id));

  if (!student)
    return next({ code: 404, msg: `student not found `});

  req.student = student;
  next();
};


// Endpoints

// Get all sections data
app.get(`/`, (req, res) => {
  res.send(sections);
});

// Get section data
app.get(`/:section`, checkSection, (req, res) => {
  const section = sections[req.params.section];
  res.send(section);
});

// Get student by section and student ID
app.get(`/:section/:id`, checkSection, findStudent, (req, res) => {
  res.send(req.student);
});

// Add a new student
app.post(`/:section`, checkSection, checkStudent, (req, res) => {
  const section = req.section;
  const body = req.body;

  // Check if there is space in the section
  if (!section.left)
    return next({ code: 400, msg: `the section is full` });

  // Check if the student already exists
  if (section.list.find(({ id }) => id === body.id))
    return next({ code: 400, msg: `there is already a student with the given id` });

  // Add student
  section.list.push({
    id: body.id,
    name: body.name,
    email: body.email
  });
  section.left -= 1;

  res.status(201);
  res.send({ msg: `student added` });
});

// Update student
app.put(`/:section/:id`, checkSection, checkStudent, findStudent, (req, res) => {
  const section = req.section;
  const student = req.student;
  const body = req.body;

  // Check if the student already exists
  if (section.list.find(({ id }) => id === body.id))
    return next({ code: 400, msg: `there is already a student with the given id` });

  // Update student
  student.id = body.id;
  student.name = body.name;
  student.email = body.email;

  res.send({ msg: `student ${student.id} updated` });
});

// Delete student
app.delete(`/:section/:id`, checkSection, findStudent, (req, res) => {
  const section = req.section;
  const student = req.student;

  // Remove student
  section.list = section.list.filter(({ id }) => id !== student.id);
  section.left += 1;

  res.send({ msg: `student ${student.id} deleted` });
});


// Fallbacks

// Custom 404 page
app.use((req, res) => {
  res.status(404);
  res.send({ error: `404 - not found` });
});

// Custom 500 page
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);
  const code = err.code || 500;
  const msg = err.msg || `server error`;

  res.status(code);
  res.send({ error: `${code} - ${msg}` });
});


// Start server
app.listen(port, () => {
  console.log(`Application listening on port ${port}`);
});
