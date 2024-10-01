const form = document.getElementById("song-form");

//form.addEventListener("submit", submitFiles);

function submitFiles(e){
    e.preventDefault()
    const name = document.getElementById("name")
    const artist = document.getElementById("artist")
    const tabfound = document.getElementById("tabfound")
    const tabsfiles = document.getElementById("tabsfiles")
    const tabsaudio = document.getElementById("tabsaudio")
    const description = document.getElementById("description")
    const formData = new FormData()
    formData.append("name", name.value)
    formData.append("artist", artist.value)
    formData.append("tabfound", tabfound.value)
    formData.append("description", description.value || " ")
    
    for(let i = 0; i < tabsfiles.files.length; i++){
        formData.append("tabsfiles", tabsfiles.files[i])
    }

    for(let i = 0; i < tabsaudio.files.length; i++){
        formData.append("tabsaudio", tabsaudio.files[i])
    }

    fetch("http://localhost:3000/song", {
        method: "POST",
        body: formData
    }).then((res) => console.log(res)).catch((err) => console.log("Error occured", err))
}
