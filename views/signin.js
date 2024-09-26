

//make a async call to express to add the new user and send verification email

//these should probably just be handled on the backend with forms in a more elegant manner
function handle_login() {
    const username = document.getElementById("username")
    const password = document.getElementById("password")
    console.log("handling login")
    //send both the the function and await an response to move to another page
    compute_password(username.value, password.value).then( res => {
        //this should be replaced with some var held by the client some sort of token
        res.json().then( body => {
            if( body.auth){
                window.location.href = "http://localhost:3000" 
            } else {
                const container = document.getElementById("error")
                const error = document.createTextNode("User login failed")
                container.appendChild(error)
            }
        })
    }).catch(error => {
        //console.log(error)
        console.error("unable to get password authenication at this time")
    })

}

async function compute_password(username, password) {
    return await fetch('http://localhost:3000/login', {
        method: "POST",
        body: JSON.stringify({
            user: username,
            hash: password
        }),
        credentials: "include",
        headers: {
                  "Content-type" : "application/json; charset=UTF-8",
                  "Control-Allow-Credentials" : true
        }
    })
}


function handle_register() {
    const email = document.getElementById("email")
    const username = document.getElementById("username")
    const password = document.getElementById("password")
    //make sure that the password has all the requirements 
    // - 12 chars long
    // - lowercase and uppercase
    // - numeric char
    // - special char
    //
    // test values
    // joedoe@gmail.com
    // joeDoe
    // lfI0ZmUW1FLNMo24!jsu
    console.log(password.value) 
    //this regex was ripped straight from stack overflow who knows if it will work
    const pass_reg = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*,.-]).{8,}$/
    const pass_check = password.value.match(pass_reg)

    //if it matched the whole string then the regex was successful and the password is good
    if( pass_check != null && pass_check[0] == pass_check.input)
    {
        check_username(username.value, email.value).then( register => {
            register_user(email.value, username.value, password.value).then( sent => {

                window.location.href = "./login.html"
            }).catch(error => {
                console.log("issues with registering the user, could be a duplicate or something else")
         
        }).catch(error => {
            console.log("unable to check if new user is duplicate")
        })
        })

        
    } else {
        //alert the user that the password is not correct
        const container = document.getElementById("error-msg")
        const error = document.createTextNode("The password didn't have 8 chars, lower and uppercase, a numeric char, special char")
        container.appendChild(error)
    }
}


//check to make sure that the username and email is unique
async function check_username(in_user, in_email) {
    return await fetch("http://localhost:3000/user_uniq", {
                        method: "POST",
                        body: JSON.stringify({
                            email: in_email,
                            user: in_user
                         }),
                        headers: {
                            "Content-type" : "application/json; charset=UTF-8"
                        }
    })
}

//register the user
async function register_user(in_email, in_user, in_pass) {
    //grab the correct inputs 
    return await fetch("http://localhost:3000/user", {
        method: "POST",
        body: JSON.stringify({
            email: in_email,
            user: in_user,
            password: in_pass
        }),
        headers: {
            "Content-type" : "application/json; charset=UTF-8"
        }
    })
}

//set up the onclick
try {
   const regist = document.getElementById("register")
   regist.onclick = handle_register
}catch(error) {
    console.log(error)
}

try {
const login = document.getElementById("login")
login.onclick = handle_login
}catch(error) {
    console.log(error)
}
