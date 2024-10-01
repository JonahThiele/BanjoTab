
//set up the pg and setup the ansync calls

const { Client } = require('pg')

const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "Banjo",
    password: "horseONFliesEatAnotherPigHairBullet",
    port: "5432"
})

try {
    client.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    });
} catch(err) {
    console.log("connection error encountered");
}


function process_funky_forms(keepPreface, obj){
    if(obj['num_' + keepPreface]){
        let sql_str = '{'
        for( let i = 0; i < obj['num_' + keepPreface]; i++)
        {
            //indexing for the inputs starts at zero
            if(obj[ keepPreface + 'keep'+ i] == "true")
            {   
                sql_str = sql_str + obj[keepPreface + i] + ','
            }
        }   
        //remove the last comma because its the end of the list
        sql_str = sql_str.slice(0, -1)
        sql_str = sql_str + '}'
        return sql_str
    } else {
        return " "
    }
}


module.exports = {

    get_tab: async function(name) {
        const filePreface = await client.query('SELECT file_path FROM songs WHERE name = $1;', [name]);
        return filePreface.rows[0]['file_path']
    },

    get_songs: async function(){
        const songs = await client.query('SELECT name, altnames, artist, tabfound, tabs, audio, username, approved, description, unique_id, file_path FROM songs;')
        return songs.rows
    },

    get_song: async function(name){
        const song = await client.query('SELECT name, altnames, artist, tabfound, tabs, audio, username, approved, description, unique_id, file_path FROM songs WHERE name = $1;', [name])
        return song.rows[0]
    },

    get_unapproved: async function(){
        const songs = await client.query('SELECT name, altnames, artist, tabfound, tabs, audio, username, approved, description, unique_id, file_path FROM songs where approved = false;')
        return songs.rows
    },

    add_song: async function(song_obj, user, file_obj){
        const name = song_obj.name
        //this might have to be an empty list at first
        // I need to figure out how I can add the altnames to the form to post it
        const altnames = '{' + "bruh" + '}'
        const artist = song_obj.artist
        const tabfound = song_obj.tabfound ? song_obj.tabfound : "off"
        //this should be the paths to the files path to the file
        let tabs = '{'
        let audio = '{'
        //iterate through the files obj and add to the correct list
        //probably a function could do this better
        for(let i = 0; i < file_obj.length; i++)
        {
            if(file_obj[i].fieldname == 'tabsaudio')
            {
                audio += (file_obj[i].fieldname + ',')
            } else {
                tabs += (file_obj[i].fieldname + ',')
            }
        }

        tabs = tabs.slice(0, -1)
        audio = audio.slice(0, -1)
        tabs += '}'
        audio += '}'

        //get this from the session
        const approved = false
        const description = song_obj.description
        const song = await client.query('INSERT INTO songs (name, altnames, artist, tabfound, tabs, audio, username, approved, description, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',[name, altnames, artist, tabfound, tabs, audio, user, approved, description, " "]) 
    },

    del_song: async function(name) {
        const song = await client.query('DELETE FROM songs WHERE name = $1', [name])
    },

    update_song: async function(song_obj) {
        const name = song_obj.name
        const artist = song_obj.artist
        const tabfound = song_obj.found
        const description = song_obj.description
        //this is super janky i couldn't figure out a simple way to get this to work
        //maybe this should be some processing function 
        const tabs = process_funky_forms("tab", song_obj)
        const audio = process_funky_forms("audio", song_obj)
        const altnames = process_funky_forms("altname", song_obj)
        const song = await client.query('UPDATE songs SET name = $1, altnames = $2, artist = $3,  tabfound = $4, tabs = $5, audio = $6, approved = true, description = $7 WHERE  name = $1;',
        [name, altnames, artist, tabfound, tabs, audio, description])   
    },

    get_uniq: async function(name, email) {
        const user_u = await client.query('select case  when exists ( select * from users where username = $1 or email = $2)then cast(1 as bit) else cast(0 as bit) end', [name, email])
        return user_u
    },

    add_user: async function(user_obj) {
        //this should probably be in the 
        const password = user_obj['password']
        const user = user_obj['user']
        const email = user_obj['email']
        const usr = await client.query('INSERT INTO users (username, password, email, admin, verified) VALUES ($1, $2, $3, false, true)', [userin, hash, email]) 
    },

    check_login: async function(name) {
        const hash = await client.query('SELECT password FROM users WHERE username = $1', [name])
        return hash.rows[0]
    },

    check_admin: async function(name) {
        const is_admin = await client.query('SELECT admin FROM users WHERE username = $1', [name])
        return is_admin.rows[0]
    },

    approve_song: async function(name) {
        const approved = await client.query('UPDATE songs SET approved = true WHERE name = $1', [name])
        return approved
    }
}  
