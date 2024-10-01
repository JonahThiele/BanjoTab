const express = require('express')
const app = express()
const port = 3000

//set up ejs 
app.set('view engine', 'ejs')
//idk what this does
app
const path = require('path')
//this is suspposed to prevent the opaque blocking that is occuring
const cors = require('cors')
app.use(cors())

//require dotenv for more file safe storage of passwords, etc
require('dotenv').config()

//setup password hashing
const bcrypt = require('bcrypt')
const saltRounds = 10
//set up the mailer to verify the users after they sign up
const nodemailer = require('nodemailer')

const mailer = nodemailer.createTransport({
    host:"smtp.zoho.com",
    secure: true,
    port: 465,
    auth: {
        user: 'banjotab7@zoho.com',
        pass: process.env.ZOHO_PASS,
    }
})

//setup users sessions
const session = require('express-session')


const F_DIR = path.join(__dirname, './tabs')
const A_DIR = path.join(__dirname, './audio')

const sql = require('./sql.js')

const { Pool } = require('pg')
const pgSession = require('connect-pg-simple')(session)

//create a dedicated connection to the postgres database
const pool = new Pool({
      user: "postgres",
      host: "localhost",
      database: "Banjo",
      password: process.env.POSTGRES,
      port: "5432"
  })


//use the middle to parse the json and handle post requests as well as put requests
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, './views')))
//render the song css correctly
app.use(session({
    secret: 'some interesting secret',
    resave: true,
    cookie : {
        maxAge: 24 * 60 * 60 * 1000,
        secure: false
    },
    saveUninitialized: true
}))


const multer = require('multer')
const options = multer.diskStorage({
    destination: function ( req, file, callback) {
        //console.log(file.mimetype.startsWith() )
        if(file.mimetype.startsWith('audio/')){
            callback(null, path.join(__dirname, './audio'))
         }else if (file.mimetype.startsWith('image/')){
            callback(null, path.join(__dirname, './tabs'))
         }else if (file.mimetype == 'application/x-wine-extension-tef'){
             callback(null, path.join(__dirname, './tabs'))
         }else if (file.mimetype == 'application/pdf'){
             callback(null, path.join(__dirname, './tabs'))
         }else {
            //what does the mime type think it is?
            console.log(file.mimetype)
            callback({ error: 'Mime type not supported' })
         }
    },

   filename: function (req, file, callback) {
       //console.log(file.orginalinam)
       callback(null, file.originalname)
   }
})
const forms = multer({storage: options})
//app.use(forms)
//when a login is received change this to display a button to upload or edit a song
app.get('/', (req, res) => {
    if( req.session.loggedin && req.session.is_admin)
    {
        console.log("admin in")
        res.render('index.ejs', { data: { logged_in: true, admin: true}})
    } else if( req.session.loggedin){
        res.render('index.ejs', { data: { logged_in: true, admin: false}})
    } else {
        res.render('index.ejs', { data: { logged_in: false, admin: false}})
    }
})

// I need to rewrite this to work with the array currently it is very unsafe
app.get('/tab/:name/', (req, res) => {
    //set up the F_DIR
    res.download(req.params.name, { root : F_DIR }, function(error){
        if(!error) return;
        res.statusCode = 404
        res.send("Sorry an error occured while downloading the file")
    })
})
// I need to rewrite this to work with the array currently it is very unsafe
app.get('/audio/:name', (req, res) => {
    // get filename from the sql server and serve it from a local dir
    res.download(req.params.name, { root : A_DIR }, function(error){
        if(!error) return;
        res.statusCode = 404
        res.send("Sorry an error occured while downloading the file")
    })
})


// get a songs basic info
app.get('/song', (req, res) => {
    const info = sql.get_song(req.query.name).then(result => {
    res.render('song.ejs', { data: {
        name: result.name,
        altnames: result.altnames,
        artist: result.artist,
        tabfound: result.tabfound,
        tabs: result.tabs,
        audio: result.audio,
        username: result.username,
        description: result.description
        }})
    })
    //this should be added to middleware that would add the info to info page

})

//get all songs
app.get('/songs', (req, res) => {
    //this should bind the response to only occure after the async function promise is resolved
    const all_info = sql.get_songs().then(res.send.bind(res))
})



//get all unapproved songs we need to figure out how secure this
app.get('/unapproved', (req, res) => {
    const unapproved = sql.get_unapproved().then(res.send.bind(res))
})

//maybe this should be a get request?
app.get('/approve', (req, res) => {
    if(req.query.quickApprove == "yes")
    {
        sql.approve_song(req.query.name).then( success => {
            res.redirect('approval.html')
        }).catch( error => {
            console.log(error)
        })
    }else {
        //populate with the songs attributes
       console.log(req.query.name)
       const info = sql.get_song(req.query.name).then(result => {
            res.render('approveTab.ejs', { data: {
                name: result.name,
                altnames: result.altnames,
                artist: result.artist,
                tabfound: result.tabfound,
                tabs: result.tabs,
                audio: result.audio,
                username: result.username,
                description: result.description
            }})
        })
     
    }
})
// add a new song
app.post('/song',forms.any(), (req, res) => {
    //pass the whole object so we don't need to pack and unpack it
    console.log(req.files)
    const song_obj  = req.body
    console.log(req.body)
    //pass in the files in order to get the correct names of the files
    sql.add_song(song_obj, req.session.user, req.files)
    //return to the homepage
    res.redirect("/")
})

// remove a song, removed type because it is easier to use the post instead from the html forms
app.post('/songd', (req, res) => {
    //make sure only admins can do it
    if(req.session.is_admin){
        sql.del_song(req.body.name)
        res.redirect("/")
    }
    //route back to the homepage
    //return something to say that it was successful if it was
})

// update a song info and tab
app.post('/songe', (req, res) => {
    //make sure only admins can do it
    if(req.session.is_admin){
        sql.update_song(req.body).then( resp => {
            res.redirect("approval.html")
        })
    }
})


//check user password 
app.post('/login', (req, res) => {
    //return the bcrypt password and check the hash
    sql.check_login(req.body.user).then( resp => {
    bcrypt.compare(req.body.hash, resp['password'], (err, result) => {
            if(err) {
                //I should be using error instead of log for error messages
                console.error("hash comparing failed")
            }
            if(result) {
                res.json({auth: true})
                console.log("hash matches authenicate the user")
                req.session.loggedin = true
                req.session.user = req.body.user
                req.session.save()
                //check if admin and set the session if that is the case
                sql.check_admin(req.body.user).then( resp2 => {
                    //if admin is true
                    if(resp2){
                        req.session.is_admin = true

                    }
                    req.session.save()
                })
                //res.send("authenticated")

            } else {
                console.log("hash doesn't match, user auth failed")
                res.send("not authenicated")
            }
    })
  })
})

//to render the correct delete and edit options for the banjo tab
app.get('/admin/:user', (req, res) => {
    sql.check_admin(req.parameter.user).then( resp => {
        res.send(resp)
    })
})

app.put('/verify', (req, res) => {
    //this should be called by the link that is generated and placed in the verification email
    //this maybe should include a timestamp for security, but not for this simple case
})

// add a new user
app.post('/user', (req, res) => {
    const user_obj = req.body
    let salt_s = undefined
    bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
            console.log("Error during salt generation occured")
            return
        }
    })

    bcrypt.hash(req.body.password, salt_s, (err, hash) => {
              if(err) {
                  console.log("Error creating a Hash talk to sql server")
                  return
              }
              console.log(hash)
              add_user_whash(user, email, hash)
              console.log("finished hash")
              return

    })
    sql.add_user(user_obj).then( res => {
        //set the email with node mailer
    }).catch(err => {
        console.log("error encountered adding a new user")
    })
   // I will deal with all the verifiction issues later
   // the library is not playing nice with the 
   console.log("sending a registration email")
   console.log(user_obj.email)
   const mailopt = {
            from: 'banjotab7@zoho.com',
            to: 'jonahthiele@yahoo.com',
            subject: 'Verify email for Banjo Tab',
            text: 'Verify your email for Banjo Tab, doing so is the only way that you can edit or add tabs' 
        }
    mailer.sendMail(mailopt, function(error, info){
        if(error){
            console.log(error)
        } else {
            console.log(info.response);
        }
    })

})
//check if username is unique
app.post('/user_uniq', (req, res) => {
    const uniq = sql.get_uniq(req.body.name, req.body.email).then(res.send.bind(res))
})

//create an express listener this allows the routes to work
app.listen(port, () => {

})
