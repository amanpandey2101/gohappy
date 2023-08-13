require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const multer = require("multer");
// const upload = multer({dest:'uploads/holiday/'})
const pool = require("./config/database.js");

// const pool = new Pool({
//   user: process.env.DB_USER,
// 	host: process.env.DB_HOST,
// 	database: process.env.DB_DATABASE,
// 	password: process.env.DB_PASSWORD,
// 	port: process.env.DB_PORT,
// 	ssl: false,
//   idleTimeoutMillis:30000,
//   connectionTimeoutMillis:0,
//   acquireTimeoutMillis:0,
//   statement_timeout:0
// })

// const { pool } = require('./config/database.js')

const app = express();

var url = require("url");
var cors = require("cors");
const { Console } = require("console");
const { SSL_OP_TLS_D5_BUG } = require("constants");

//-----------for file upload---------------

var formidable = require("formidable");
var fs = require("fs");

const mv = require("mv");

app.use(express.static(__dirname + "/uploads"));

//--------------------------

const PORT = process.env.PORT || 3000;
let imageCounter = 1;
//const routes = require('./routes/index')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder;
    if (req.path === "/our-holiday") {
      folder = "holiday";
    
    } else if (req.path === "/offer") {
      folder = "offers";
    } else {
      folder = "uploads";
    }
    const destinationPath = `./uploads/${folder}`;
    fs.mkdirSync(destinationPath, { recursive: true });
    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    // return cb(null, `${Date.now()}-${file.originalname}`);
    const fileExtension = file.originalname.split('.').pop();
    // Create a new filename using the imageCounter and file extension
    const newFilename = `image${imageCounter}.${fileExtension}`;
    imageCounter++;

    cb(null, newFilename);
  },
});
const upload = multer({ storage });

app.use(express.static(__dirname + "/views"));

app.use(cors());

app.set("view engine", "ejs");
app.use(
  session({
    secret: "thatsecretthinggoeshere",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
// app.use(express.urlencoded({extended:false}))-
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  res.locals.message = req.flash("message");
  next();
});

//app.use('/', routes)
require("./config/passport.js")(passport);

app.listen(PORT, () => {
  console.log(`Application server started on port: ${PORT}`);
});

//------------------------ROUTINGS FOR Admin PANEL----------------------------//

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("index", {
      title: "index",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
  //res.render("index.ejs");
});

app.get("/accomodation_management", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("accomodation", {
      title: "accomodation",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
  //res.render("index.ejs");
});

app.get("/admin/service_management", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("service", {
      title: "service",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
  //res.render("index.ejs");
});

app.get("/admin/our-holiday", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("our_holiday.ejs", {
      title: "our-holiday",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
});

app.post("/admin/our-holiday", upload.single("imageData"), async (req, res) => {
  try {
    const {  title, location, description } = req.body;
    const imageFilePath = req.file.path;
    const imageData = fs.readFileSync(imageFilePath);

    const query =
      "INSERT INTO our_holiday_picks ( title, location, description, imagedata) VALUES ($1, $2, $3, $4)";
    await pool.query(query, [title, location, description, imageData]);
    console.log(req.file);
    res.redirect("/our-holiday");
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/admin/our-holiday/getdata", async(req, res)=>{
  try{
    const holidayResult = await pool.query('SELECT id , title, location, description, encode(imagedata, \'base64\') as imagedata FROM our_holiday_picks');
    const holidayRows = holidayResult.rows;
    res.json(holidayRows); 
  }catch (error) {
    console.error('Error retrieving data from the database:', error);
    res.status(500).send('Internal Server Error');
  }
})

app.delete("/admin/our-holiday/delete/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Received id for deletion:", id); // Add this line to check if the id is being received

  try {
    // Perform the database delete operation
    const query = "DELETE FROM our_holiday_picks WHERE id = $1";
    await pool.query(query, [id]);
    res.json({ message: "Item deleted successfully." });
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/order_details", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("order_details", {
      title: "order_details",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
  //res.render("index.ejs");
});

app.get("/admin/packages", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("package", {
      title: "package",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
  //res.render("index.ejs");
});

app.get("/admin/reviews", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("404-page-not-found.ejs", {
      title: "404-page-not-found.ejs",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
  //res.render("index.ejs");
});

app.get("/admin/subscriber", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("subscriber", {
      title: "subscriber",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
  //res.render("index.ejs");
});

app.get("/admin/settings", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("settings", {
      title: "settings",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
  //res.render("index.ejs");
});

app.get("/404-page-not-found", (req, res) => {
  res.render("404-page-not-found.ejs");
});

app.get("/admin/undefined", (req, res) => {
  res.render("404-page-not-found.ejs");
});

app.get("/admin/error", (req, res) => {
  res.render("404-page-not-found.ejs");
});

app.get("/add_user", (req, res) => {
  res.render("add_user.ejs");
});
//------------------------END ROUTINGS FOR USER PANEL------------------------//

//----------------------------------------APIs For Register Admin and Update PSW Section Start-----------------------------------------//

app.get("/admin/register", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/register");
  } else {
    res.render("register", {
      title: "Register",
      user: req.user,
      message: res.locals.message,
    });
  }
});

app.post(
  "/admin/register",
  (req, res, next) => {
    //req.flash('message', 'You are already logged in.')
    //res.redirect('/profile')
    let user = req.body.username.toLowerCase();
    let pass = req.body.password;
    let passConf = req.body.passConf;
    let name = req.body.name;
    let phone = req.body.phone;
    let email = req.body.email;
    if (user.length === 0 || pass.length === 0 || passConf.length === 0) {
      req.flash(
        "message",
        "You must provide a username, password, and password confirmation."
      );
      res.redirect("/register");
    } else if (pass != passConf) {
      req.flash(
        "message",
        "Your password and password confirmation must match."
      );
      res.redirect("/register");
    } else {
      next();
    }
  },
  passport.authenticate("register", {
    successRedirect: "/",
    failureRedirect: "/admin/register",
    failureFlash: true,
  })
);

app.get("/admin/login", (req, res) => {
  if (req.isAuthenticated()) {
    req.flash("message", "Your are already logged in.");
    res.redirect("/");
  } else {
    res.render("login", {
      title: "Login",
      user: req.user,
      message: res.locals.message,
    });
  }
});

app.get("/admin/connTest", async (req, res) => {
  console.log("Ok");

  const client = await pool.connect();
  try {
    await client.query('SELECT NOW() AS "CurrTime"', async (error, results) => {
      var time = results.rows[0].CurrTime;
      if (error) {
        res.status(502).json({ status: 0, data: error });
        return;
      }

      console.log("Working " + time);
      res.send("Working " + time);
    });
  } catch (err) {
    res.status(502);
    res.send(err.message);
  }
});

app.post(
  "/admin/login",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      req.flash("message", "You are already logged in.");
      res.redirect("/");
    } else {
      let user = req.body.username.toLowerCase();
      let pass = req.body.password;
      if (user.length === 0 || pass.length === 0) {
        req.flash("message", "You must provide a username and password.");
        res.redirect("/admin/login");
      } else {
        next();
      }
    }
    console.log("okkk");
  },
  passport.authenticate("login", {
    successRedirect: "/",
    failureRedirect: "/error",
    failureFlash: true,
  })
);

app.get("/admin/logout", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("User [" + req.user.username + "] has logged out.");
    req.logout(function(err) {
      if (err) {
        console.log("Error logging out:", err);
        return next(err);
      }
      res.redirect("/login");
    });
  } else {
    res.redirect("/login");
  }
});


app.post(
  "/admin/updpass",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      let password = req.body.password;
      let newpass = req.body.newpass;
      let newpassconf = req.body.newpassconf;
      if (
        password.length === 0 ||
        newpass.length === 0 ||
        newpassconf.length === 0
      ) {
        req.flash(
          "message",
          "You must provide your current password, new password, and new password confirmation."
        );
        res.redirect("/error");
      } else if (newpass != newpassconf) {
        req.flash(
          "message",
          "Your password and password confirmation must match."
        );
        res.redirect("/error");
      } else {
        next();
      }
    } else {
      res.redirect("/");
    }
  },
  passport.authenticate("updatePassword", {
    successRedirect: "/",
    failureRedirect: "/error",
    failureFlash: true,
  })
);

//----------------------------------------APIs For Register Admin and Update PSW Section End-------------------------------------------//

//--------------------------------------------------------------API's Started----------------------------------------------------------//

//===================================================Advertisement Section Start=======================================================//
app.post("/admin/add/advertisement", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var title = fields.title;

    var status = "Active";

    console.log(title, status);

    pool.query(
      `INSERT INTO advertisement(img_title, status)
      VALUES($1, $2)
      returning id`,
      [title, status],
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        var id = data[0].id;
        var extension = ".jpg";
        var newPathcover = "uploads/add/img" + id + extension;

        mv(files.img.filepath, newPathcover, function (err) {
          if (err) {
            console.log("err:", err);
            throw err;
          } else {
            console.log("file renamed");
          }
        });
        res.redirect("/advertisement");
      }
    );
  });
});

app.get("/admin/advertisement/getdata", async (req, res) => {
  pool.query(
    `SELECT * FROM advertisement where status='Active'`,
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});

app.get("/advertisement/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
    "select * from advertisement where id=$1",
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/advertisement/delete", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  var status = "Deactive";
  pool.query(
    "UPDATE advertisement set status = $1 where id = $2",
    [status, id],

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      console.log(data);

      res.send(data);
    }
  );
});
//===================================================Advertisement Section End=========================================================//

//=====================================================Packages Section Start==========================================================//
app.get("/offer", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("offer", {
      title: "offer",
      user: req.user,
      message: res.locals.message,
    });
  } else {
    res.render("login", {
      title: "Log In",
      user: req.user,
      message: res.locals.message,
    });
  }
});
app.post("/offer", upload.single("imageData"), async (req, res) => {
  try {
    const { title, price, description } = req.body;
    const imageFilePath = req.file.path;
    const imageData = fs.readFileSync(imageFilePath);
    const query =
      "INSERT INTO offer (title, price, description, imagedata) VALUES ($1, $2, $3, $4)";
    await pool.query(query, [title, price, description, imageData]);
    console.log(req.file);
    res.redirect("/offer");
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/offer/getdata", async(req, res)=>{
  try{
    const offerResult = await pool.query('SELECT id, title, price, description, status, encode(imagedata, \'base64\') as imagedata FROM offer');
    const offerRows = offerResult.rows;
    res.json(offerRows); 
  }catch (error) {
    console.error('Error retrieving data from the database:', error);
    res.status(500).send('Internal Server Error');
  }
})

app.delete("/offer/delete/:id", async (req, res) => {
  const id = req.params.id;
  console.log("Received id for deletion:", id); // Add this line to check if the id is being received

  try {
    // Perform the database delete operation
    const query = "DELETE FROM offer WHERE id = $1";
    await pool.query(query, [id]);
    res.json({ message: "Item deleted successfully." });
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/contact', async(req, res)=>{
  res.render("contact.ejs")
})

app.get("/contact/getdata", async(req, res)=>{
  try{
    const contactResult = await pool.query('SELECT id,name,email, mobile, message FROM contact');
    const data = contactResult.rows;
    res.send(data)
    
  }catch (error) {
    console.error('Error retrieving data from the database:', error);
    res.status(500).send('Internal Server Error');
  }
})
app.get("/contact/count/getdata", async(req, res)=>{
  try{
    const data = await pool.query(`SELECT count(id) FROM contact`);

    res.send(data.rows)
    
  }catch (error) {
    console.error('Error retrieving data from the database:', error);
    res.status(500).send('Internal Server Error');
  }
})


// app.get("/offer/getdata/edit", async (req, res) => {
//   var data = url.parse(req.url, true);
//   data = data.query;
//   var id = data.id;
//   pool.query("select * from offer where id=$1", [id], (err, results) => {
//     if (err) {
//       throw err;
//     }
//     let data = results.rows;
//     console.log(data);
//     res.send(data);
//   });
// });

app.post("/update/offer", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var id = fields.edit_id;
    var title = fields.edit_title;
    var price = fields.edit_price;
    var description = fields.edit_description;

    var status = "Active";

    console.log(id, title, price, description, status);

    pool.query(
      `UPDATE offer set title=$1, price=$2, description=$3 where id = $4`,
      [title, price, description, id],
      (err, results) => {
        if (err) {
          throw err;
        }
        var extension = ".jpg";
        var newPathcover = "uploads/offers/cover/img" + id + extension;

        mv(files.edit_img.filepath, newPathcover, function (err) {
          if (err) {
            console.log("err:", err);
            throw err;
          } else {
            console.log("file renamed");
          }
        });
        res.redirect("/offer");
      }
    );
  });
});

app.get("/offer/delete", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  fs.unlink("uploads/offers/cover/img" + id + ".jpg", function (err) {
    if (err) throw err;
    console.log("File deleted!");
  });
  pool.query(
    `DELETE FROM offer where id = $1 returning id`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});
//======================================================Packages Section End===========================================================//

//=======================================================accomodation start==========================================================//

// app.post("/add/accomodation", upload.single("imagedata"), async (req, res) => {
//   try {
//     const { category, price, disc, description, name, location } = req.body;
//     const imageFilePath = req.file.path;
//     const imagedata = fs.readFileSync(imageFilePath);
//     const query =
//       "INSERT INTO accomodation (category, price, disc, description,  name, location, imagedata) VALUES ($1, $2, $3, $4, $5, $6, $7)";
//     await pool.query(query, [
//       category,
//       price,
//       disc,
//       description,
//       name,
//       location,
//       imagedata,
//     ]);
//     console.log(req.file);
//     res.redirect("/accomodation_management");
//   } catch (error) {
//     console.error("Error inserting data:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.post("/admin/add/accomodation", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {

    var category = fields.category;
    var price = fields.price;
    var description = fields.description;
    var name = fields.name;
    var disc = fields.disc;
    var top = fields.top_accomodation;
    var location = fields.location;

    var status = 'Active';

    if (!disc) {
      disc = parseInt(0)
    }
    else {
      disc = fields.disc;
    }

    console.log(category, price, description, status, name, disc, location);

    pool.query(
      `INSERT INTO accomodation(category, price, description, status, disc, name, top, location)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      returning id`,
      [category, price, description, status, disc, name, top, location],
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        var id = data[0].id;
        var extension = '.jpg';
        var newPathcover = "uploads/accomodation/cover/img" + id + extension;

        mv(files.img.filepath, newPathcover, function (err) {
          if (err) {
            console.log('err:', err);
            throw err;
          } else {
            console.log("file renamed")
          }
        });
        res.redirect("/accomodation_management");
      }
    );
  })
});

app.get("/admin/accomodation/getdata", async (req, res) => {
  pool.query(`SELECT * FROM accomodation`, (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    res.send(data);
  });
});

app.get("/accomodation/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query("select * from accomodation where id=$1", [id], (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    console.log(data);
    res.send(data);
  });
});

app.post("/update/accomodation", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var id = fields.edit_id;
    var category = fields.edit_category;
    var name = fields.edit_name;
    var price = fields.edit_price;
    var disc = fields.edit_disc;
    var top = fields.edit_top;
    var description = fields.edit_description;
    var location = fields.edit_location;

    var status = "Active";

    console.log(
      id,
      category,
      name,
      price,
      disc,
      top,
      description,
      status,
      location
    );

    pool.query(
      `UPDATE accomodation set category=$1, name =$2, price=$3, disc=$4, top=$5, description=$6, location=$7 where id = $8`,
      [category, name, price, disc, top, description, location, id],
      (err, results) => {
        if (err) {
          throw err;
        }
        var extension = ".jpg";
        var newPathcover = "uploads/accommodation" + id + extension;

        mv(files.edit_img.filepath, newPathcover, function (err) {
          if (err) {
            console.log("err:", err);
            throw err;
          } else {
            console.log("file renamed");
          }
        });
        res.redirect("/accomodation_management");
      }
    );
  });
});

app.get("/accomodation/delete", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  fs.unlink("uploads/accomodation/cover/img" + id + ".jpg", function (err) {
    if (err) throw err;
    console.log("File deleted!");
  });
  pool.query(
    `DELETE FROM accomodation where id = $1 returning id`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});

app.get("/accomodation/count/getdata", async (req, res) => {
  pool.query(`SELECT count(id) FROM accomodation`, (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    res.send(data);
  });
});

//--------------------all accomodation images-------------------//

app.post("/add/accomodation/all/images", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var accomodation_name = fields.accomodation_name;
    var tag_name = fields.tag_name;

    var status = "Active";

    console.log(accomodation_name, tag_name, status);

    pool.query(
      `INSERT INTO accomodation_img(accomodation_name, tag_name, status)
      VALUES($1, $2, $3)
      returning id`,
      [accomodation_name, tag_name, status],
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        var id = data[0].id;
        var extension = ".jpg";
        var newPathcover = "uploads/accomodation/all/img" + id + extension;

        mv(files.all_img.filepath, newPathcover, function (err) {
          if (err) {
            console.log("err:", err);
            throw err;
          } else {
            console.log("file renamed");
          }
        });
        res.redirect("/accomodation_management");
      }
    );
  });
});

app.get("/accomodation/all/images/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
    "select * from accomodation_img where accomodation_name=$1",
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/accomodation/all/images/getdata/edit/by/id", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
    "select * from accomodation_img where id=$1",
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/accomodation/all/img/delete", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  fs.unlink("uploads/accomodation/all/img" + id + ".jpg", function (err) {
    if (err) throw err;
    console.log("File deleted!");
  });
  pool.query(
    `DELETE FROM accomodation_img where id = $1 returning id`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});
//--------------------all accomodation images-------------------//

//=======================================================accomodation end============================================================//

//======================================================services start===============================================================//
app.post("/add/services", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var category = fields.category;
    var price = fields.price;
    var description = fields.description;
    var name = fields.name;
    var disc = fields.disc;

    var discount;

    if (!disc) {
      discount = parseInt(0);
    } else {
      discount = parseInt(disc);
    }

    var status = "Active";

    console.log(category, price, description, name, discount);

    pool.query(
      `INSERT INTO services(category, price, description, status, name, disc)
      VALUES($1, $2, $3, $4, $5, $6)
      returning id`,
      [category, price, description, status, name, discount],
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        var id = data[0].id;
        var extension = ".jpg";
        var newPathcover = "uploads/services/cover/img" + id + extension;

        mv(files.img.filepath, newPathcover, function (err) {
          if (err) {
            console.log("err:", err);
            throw err;
          } else {
            console.log("file renamed");
          }
        });
        res.redirect("/service_management");
      }
    );
  });
});

app.get("/services/getdata", async (req, res) => {
  pool.query(`SELECT * FROM services`, (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    res.send(data);
  });
});

app.get("/services/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query("select * from services where id=$1", [id], (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    console.log(data);
    res.send(data);
  });
});

app.post("/update/services", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var id = fields.edit_id;
    var category = fields.edit_category;
    var price = fields.edit_price;
    var description = fields.edit_description;
    var name = fields.edit_name;
    var disc = fields.edit_disc;

    var status = "Active";

    console.log(id, category, price, description, status, name, disc);

    pool.query(
      `UPDATE services set category=$1, price=$2, description=$3, name=$4, disc=$5 where id = $6`,
      [category, price, description, name, disc, id],
      (err, results) => {
        if (err) {
          throw err;
        }
        var extension = ".jpg";
        var newPathcover = "uploads/services/cover/img" + id + extension;

        mv(files.edit_img.filepath, newPathcover, function (err) {
          if (err) {
            console.log("err:", err);
            throw err;
          } else {
            console.log("file renamed");
          }
        });
        res.redirect("/service_management");
      }
    );
  });
});

app.get("/services/delete", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  fs.unlink("uploads/services/cover/img" + id + ".jpg", function (err) {
    if (err) throw err;
    console.log("File deleted!");
  });
  pool.query(
    `DELETE FROM services where id = $1 returning id`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});

app.get("/services/count/getdata", async (req, res) => {
  pool.query(`SELECT count(id) FROM services`, (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    res.send(data);
  });
});
//====================================================services end=======================================//

//======================================================Review Section Start===========================================================//

/*app.post("/add/review", async (req, res) => {

  let { name, rating, feedback } = req.body;
  let errors = [];

  var status = 'Active';
  
  console.log(name, rating, feedback, status);
  
  if (!name || !rating || !feedback || !status) {
    errors.push({ message: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.redirect("/404-page-not-found");
  } else{
      pool.query(
        `INSERT INTO review(name, rating, feedback, status)
          VALUES($1, $2, $3, $4)
          returning id`,
        [name, rating, feedback, status],
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/reviews");
        }
      );
    }
});

app.get("/review/getdata", async (req, res) => {
  pool.query(
      `SELECT * FROM review where status='Active'`,
      (err, results) => {
          if (err) {
              throw err;
          }
          let data = results.rows;
          res.send(data);
      }
  );
});

app.get("/review/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from review where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.post("/update/review", async (req, res) => {

  let { edit_id, edit_name, edit_rating, edit_feedback } = req.body;
  let errors = [];
  
  console.log(edit_id, edit_name, edit_rating, edit_feedback);
  
  if (!edit_id || !edit_name || !edit_rating || !edit_feedback) {
    errors.push({ message: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.redirect("/404-page-not-found");
  } else{
      pool.query(
        `UPDATE review set name=$1, rating=$2, feedback=$3 where id = $4`,
        [edit_name, edit_rating, edit_feedback, edit_id],
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/reviews");
        }
      );
    }
});

app.get("/reviews/delete", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  
  pool.query(
    `DELETE FROM review where id = $1 returning id`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});*/
//=========================================================Review Section End==========================================================//

//======================================================subscriber Section Start===========================================================//

app.get("/subscriber/getdata", async (req, res) => {
  pool.query(`SELECT * FROM subscribtion`, (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    res.send(data);
  });
});

app.get("/subscriber/getdata/today", async (req, res) => {
  //------------------date----------------------//

  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Calcutta",
  });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  var new_date = date_yyyy_mm_dd;
  var new_time = time_hh_mm_ss;

  pool.query(
    `SELECT count(id) FROM subscribtion where date = $1`,
    [new_date],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});
//=====================================================Subscriber Section End==========================================================//

//=====================================================Packages Section Start==========================================================//

app.post("/add/package", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var title = fields.title;
    var price = fields.price;
    var description = fields.description;
    var disc = fields.disc;

    var discount;

    if (!disc) {
      discount = parseInt(0);
    } else {
      discount = parseInt(disc);
    }

    var status = "Active";

    console.log(title, price, description, status, discount);

    pool.query(
      `INSERT INTO package(title, price, description, status, disc)
      VALUES($1, $2, $3, $4, $5)
      returning id`,
      [title, price, description, status, discount],
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        var id = data[0].id;
        var extension = ".jpg";
        var newPathcover = "uploads/package/cover/img" + id + extension;

        mv(files.img.filepath, newPathcover, function (err) {
          if (err) {
            console.log("err:", err);
            throw err;
          } else {
            console.log("file renamed");
          }
        });
        res.redirect("/packages");
      }
    );
  });
});

app.get("/package/getdata", async (req, res) => {
  pool.query(`SELECT * FROM package`, (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    res.send(data);
  });
});

app.get("/package/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query("select * from package where id=$1", [id], (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    console.log(data);
    res.send(data);
  });
});

app.post("/update/package", async (req, res) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, function (error, fields, files) {
    var id = fields.edit_id;
    var title = fields.edit_title;
    var price = fields.edit_price;
    var description = fields.edit_description;
    var disc = fields.edit_disc;

    var status = "Active";

    console.log(id, title, price, description, status, disc);

    pool.query(
      `UPDATE package set title=$1, price=$2, description=$3, disc=$4 where id = $5`,
      [title, price, description, disc, id],
      (err, results) => {
        if (err) {
          throw err;
        }
        var extension = ".jpg";
        var newPathcover = "uploads/package/cover/img" + id + extension;

        mv(files.edit_img.filepath, newPathcover, function (err) {
          if (err) {
            console.log("err:", err);
            throw err;
          } else {
            console.log("file renamed");
          }
        });
        res.redirect("/packages");
      }
    );
  });
});

app.get("/package/delete", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  fs.unlink("uploads/package/cover/img" + id + ".jpg", function (err) {
    if (err) throw err;
    console.log("File deleted!");
  });
  pool.query(
    `DELETE FROM package where id = $1 returning id`,
    [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});
//======================================================Packages Section End===========================================================//

//=========================================================Vendor List Start===========================================================//

/*app.get("/vendor/getdata", async (req, res) => {
  pool.query(
      `SELECT * FROM users where username != 'admin'`,
      (err, results) => {
          if (err) {
              throw err;
          }
          let data = results.rows;
          res.send(data);
      }
  );
});

app.get("/username/getdata", async (req, res) => {
  pool.query(
      "SELECT * FROM users where username = " + "'" + vendor_name + "'",
      (err, results) => {
          if (err) {
              throw err;
          }
          let data = results.rows;
          res.send(data);
      }
  );
});

app.get("/building/getdata", async (req, res) => {
  console.log(vendor_name);
  pool.query(
      "select * from building where username = " + "'" + vendor_name + "' and bin_status='Active'",
      //`SELECT * FROM building where username=$1 and bin_status='Active'`,
      //[id],
      (err, results) => {
          if (err) {
              throw err;
          }
          let data = results.rows;
          res.send(data);
      }
  );
});

app.get("/building/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  pool.query(
   "select * from building where id=$1",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/building_img/getdata/edit", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  console.log(id);
  pool.query(
   "select * from building_img where building_id=$1 and status='Active' order by id desc limit 8",
   [id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.post("/edit/building", async (req, res) => {

  let { edit_building_id, edit_building_name, edit_building_type, edit_contact_number, edit_amount, edit_amount_admin, edit_room_types, edit_facility, edit_city, edit_address, edit_description, edit_status, edit_visibility, edit_top_accommodations, edit_total_room, edit_rating, edit_discount } = req.body;
  let errors = [];
  
  if (!edit_building_id || !edit_building_name || !edit_building_type || !edit_contact_number || !edit_amount || !edit_amount_admin || !edit_room_types || !edit_facility || !edit_city || !edit_address || !edit_description || !edit_visibility || !edit_top_accommodations || !edit_rating || !edit_discount) {
    console.log(edit_building_id, edit_building_name, edit_building_type, edit_contact_number, edit_amount, edit_amount_admin, edit_room_types, edit_facility, edit_city, edit_address, edit_description, edit_visibility, edit_top_accommodations, edit_rating, edit_discount);
    errors.push({ message: "Please enter all fields" });
  }
  if (errors.length > 0) {
    console.log(errors);
    res.redirect("/");
  } else{
      pool.query(
        `UPDATE building set name = $1, building = $2, contact_number = $3, amount = $4, admin_price = $5, room_types = $6, facility = $7, city = $8, address = $9, description = $10, visibility = $11, top_accommodations = $12, rating = $13, discount = $14  where id = $15`,
        [edit_building_name, edit_building_type, edit_contact_number, edit_amount, edit_amount_admin, edit_room_types, edit_facility, edit_city, edit_address, edit_description, edit_visibility, edit_top_accommodations, edit_rating, edit_discount, edit_building_id],
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/vendor_management");
        }
      );
    }
});*/

//==========================================================Vendor List End============================================================//

//========================================================Order History Start==========================================================//

app.get("/order-history/getdata", async (req, res) => {
  pool.query(
    "select * from order_history where client_id is null order by id desc",
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});

app.get("/order/getdata/today", async (req, res) => {
  //------------------date----------------------//

  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Calcutta",
  });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  var new_date = date_yyyy_mm_dd;
  var new_time = time_hh_mm_ss;

  pool.query(
    `SELECT count(id) FROM order_history where new_date = $1`,
    [new_date],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );
});

app.get("/order/child/details", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var client_id = data.client_id;
  pool.query(
    "select * from order_history where client_id=$1",
    [client_id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});

app.get("/order/client/details", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var client_id = data.client_id;
  pool.query(
    "select * from order_history where id=$1",
    [client_id],
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );
});
//========================================================Order History End============================================================//

//--------------------------------------------------------------API's Ended------------------------------------------------------------//
