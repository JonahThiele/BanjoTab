// event listerner for click

//this worked easiest as a global var
let data = []

document.addEventListener('DOMContentLoaded', (event) => {
    //event listener for the search function
    //also add the event listener for this if we don't want the button
    const search = document.getElementById("tab-search")
    //search.addEventListener("oninput", generate_rows)
    //call at the begining once everything loads
    const clustersize = new Clusterize({
            rows: show_searched_rows(data),
            scrollId: 'scrollArea',
            contentId: 'contentArea'
    })
 
    generate_rows(clustersize)

    const form = document.getElementById("form")
    form.addEventListener("click", function(){filter_search(clustersize, data, search)}) 
})

async function grab_songs(){
        const response = await fetch("http://localhost:3000/songs")
        const json = await response.json()
        return json
}

//this should work with a single column data, but we can set it up for more this way 
function filter_search(clusterize, rows, search){
    let searched = false
    for(let i = 0; i < rows.length; i++) {
        searched = false;
        for(var j = 0; j < rows[i].values.length; j++) {
            if(rows[i].values[j].toString().toLowerCase().indexOf(search.value.toLowerCase()) + 1){
                searched = true;
            }
        }
        rows[i].active = searched;
    }
    clusterize.update(show_searched_rows(rows));
}

function show_searched_rows(rows) {
    const r_data = []
    for(let i = 0; i < rows.length; i++)
    {   
        if(rows[i].active)
        {
            r_data.push(rows[i].markup)
        }
    }
    return r_data
}


//probably a more js and simplified function to do this
function generate_rows(clustersize){
    const r_data = []
    const admin = (document.getElementById('approval-brd') != null)    
    grab_songs().then( songs => {
        for(const row in songs){
            let str
            if (admin){
                str = '<tr><td><form action="http://localhost:3000/song/" method="GET"><input type="hidden" id="name" '
                + 'name="name" value="' + songs[row]['name'] +  '"></input><input type="submit" value="' + songs[row]['name'] 
                + '"></input></form></td><td><form action="http://localhost:3000/approve" method="GET">'
                + '<input type="hidden" id="name" name="name" value="' + songs[row]['name'] + '"></input>'
                + '<input type="hidden" id="quickApprove" name="quickApprove" value="no"></input>'
                + '<input type="submit" value="edit"></input></form></td>'
                + '<td><form action="http://localhost:3000/songd" method="POST">'
                + '<input type="hidden" id="name" name="name" value="' + songs[row]['name']
                + '"></input><input type="submit" value="delete"></input></form></td></tr>'
            }else {
                str = '<tr><td><form action="http://localhost:3000/song/" method="get"><input type="hidden" id="name" name="name" value="' + songs[row]['name'] + '"></input><input type="submit" value="' + songs[row]['name'] + '"></input></form></tr></td>'
 
            }
             //normal user only sees the approved values
            if( songs[row]['approved']){
                r_data.push({
                    values: [songs[row]['name']],
                    markup: str,
                    active: true
                })
            }
      
        }
        clustersize.update(show_searched_rows(r_data))
        data = r_data
            }).catch(error => {
        console.log("data could not be fetched")
    })

}

//run the initial get request on the window load
//will need to figure out how this will run so that it doesn't immediately error=//window.onload = generate_rows()
