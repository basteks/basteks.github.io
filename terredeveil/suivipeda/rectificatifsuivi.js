var compFilled = false;
var base_bearer = '';
let suivis = [];
let data = [];
let buttonsJeunesId = [];
let occurrences = [];
let suividata = null;
spreadsheet = null;
let success = 0;
let modifsOccurrences = [];
let rows = [];

async function initnouveaurectificatif() {
  if (bearer) {
      document.getElementById('submitbutton').disabled = true;  
      let expirationDate = localStorage.getItem("SeaTableExpirationDate");
      if(new Date()>new Date(expirationDate)) {
	  console.log('Getting new token');
	  const tokenOptions = {
		  method: 'GET',
		  headers: {
			accept: 'application/json',
			authorization: 'Bearer ' + bearer
		  }
		};
		
	  let tokenPromise = await fetch(server+'/api/v2.1/dtable/app-access-token/', tokenOptions)
	  .then(response => response.json())
	  .then(function(response) {
		 fromBearer(response);
	  })
	  .catch(error => console.log(error));
      }
      else {
	base_bearer = localStorage.getItem("SeaTableBearer");
	listSuivis();
      }
  }
};

async function fromBearer(resp) {
  base_bearer = resp.access_token;
  var date = new Date();
  date.setDate(date.getDate() + 3);
  localStorage.setItem("SeaTableExpirationDate",date);
  localStorage.setItem("SeaTableBearer",base_bearer);
  listSuivis();
};

async function listSuivis() {
  const options = {
      method: 'POST',
      headers: {
	accept: 'application/json',
	'content-type': 'application/json',
	authorization: 'Bearer '+base_bearer
      },
      body: JSON.stringify({convert_keys: true, sql: 'select * from PEDA_Suivis where Occurrences>=0'})
  };

  await fetch(server+'/dtable-db/api/v1/query/'+base_uuid+'/', options)
  .then(response => response.json())
  .then(function(response) {
	 fromSuivis(response);
  })
  .catch(err => console.error(err));
}

async function fromSuivis(resp) {
    console.log(resp);
    for(let i=0;i<resp.results.length;i++) {
	    await suivis.push({"id" : resp.results[i].ID, "trimestre": resp.results[i].Trimestre, "activites": resp.results[i]['Activité'], "jeunes": resp.results[i].Jeunes, "occurrences": resp.results[i].Occurrences});
    }
    data=[];
    for (let c=0;c<suivis.length;c++) {
	let activitesStr = "";
	for (let a=0;a<suivis[c].activites.length;a++) {
	    if (activitesStr!="") { activitesStr += ", "; }
	    activitesStr += suivis[c].activites[a].display_value;
	}
	let jeunesStr = "";
	for (let j=0;j<suivis[c].jeunes.length;j++) {
	    if (jeunesStr!="") { jeunesStr += ", "; }
	    jeunesStr += suivis[c].jeunes[j].display_value;
	}
	data.push({'trimestre': suivis[c].trimestre, 'activites': wrapText(activitesStr,50), 'jeunes': wrapText(jeunesStr,50),'occurrences': suivis[c].occurrences});
    }
    if (spreadsheet == null) {
	spreadsheet = jspreadsheet(document.getElementById('spreadsheet'), {
	    data:data,
	    columns: [
		{ type: 'text', title:'Trim.', 'name': 'trimestre', readOnly:true, width:60 },
		{ type: 'text', title:'Activités', 'name': 'activites', readOnly:true, wrap: true, width:500 },
		{ type: 'text', title:'Jeunes', 'name': 'jeunes', readOnly:true, width:500 },
		{ type: 'numeric', title:'Occurr.', 'name': 'occurrences', width:60 }
	     ],
	    filters: true,
	    onchange: changed,
	    onselection: selected,
	});
	spreadsheet.hideIndex();
    }
    else {
	spreadsheet.setData(data);
    }
    document.getElementById('loader').classList.add('disp');
}

function wrapText(text,lim=25) {
  let txt = text;
  if (txt!= null) {
      let start = 0;
      let split = txt.split(" ");
      for (let i=0;i<split.length;i++) {
	  let idx = txt.indexOf(split[i]);
	  if (idx-start>lim) {
	      txt = txt.slice(0,idx-1)+'\n'+txt.slice(idx,txt.length);
	      start = idx-1;
	  }
      }
  }
  return txt;
}

function toogle(o) {
    for (let b=0;b<buttonsJeunesId[Number(o)].length;b++) {
	document.getElementById(buttonsJeunesId[Number(o)][b]).click();
    }
    
}

function findInArray(arr,val,id="row_id") {
    let res = null;
    for (let i=0;i<arr.length;i++) {
	if (arr[i][id] == val) {
	    res = arr[i];
	    break;
	}
    }
    return res;
}

function toogleClick(event) {
    const list = event.target.id[8]=='a' ? 'activites' : 'jeunes';
    const prop = event.target.id[8]=='a' ? 'done' : 'abs';
    let val = findInArray(occurrences[Number(event.target.id[7])][list],event.target.value);
    val[prop] = !val[prop];
    occurrences[Number(event.target.id[7])][list+'total'] += val[prop]? 1:-1;
    if (event.target.classList.contains('clicked')) {
	event.target.classList.remove('clicked');
    }
    else {
	event.target.classList.add('clicked');
    }
}

function createRow(o) {
    let occ = [];
    let actis = []
    let jeunesHTML = "";
    let jeunesOcc = [];
    let actisOcc = [];
    let doneActis = 0;
    for (let j=0;j<suividata.jeunes.length;j++) {
	jeunesHTML += '<button type="button" id="buttono'+o.toString()+'j'+j.toString()+'" onclick="toogleClick(event)" class="btnsuivi" value="'+suividata.jeunes[j].row_id+'">'+suividata.jeunes[j].display_value+'</button>';
	occ.push('buttono'+o.toString()+'j'+j.toString());
	jeunesOcc.push({});
	jeunesOcc[j].row_id = suividata.jeunes[j].row_id;
	jeunesOcc[j].display_value = suividata.jeunes[j].display_value;
	jeunesOcc[j].abs=false;
    }
    let activitesHTML = "";
    for (let a=0;a<suividata.activites.length;a++) {
	activitesHTML += '<button type="button" id="buttono'+o.toString()+'a'+a.toString()+'" class="clicked btnsuivi" onclick="toogleClick(event)" value="'+suividata.activites[a].row_id+'">'+suividata.activites[a].display_value+'</button>';
	actisOcc.push({});
	actisOcc[a].row_id = suividata.activites[a].row_id;
	actisOcc[a].display_value = suividata.activites[a].display_value;
	actisOcc[a].done=true;
	doneActis += 1;
    }
    document.getElementById('occurrencesBody').innerHTML += '<tr><td><input type="checkbox" id="cb'+o.toString()+'" class="cbselect"></td><td>'+suividata.trimestre+'</td><td><input id="occ'+o.toString()+'" type="checkbox" onclick="toogle('+o.toString()+')"></td><td>'+jeunesHTML+'</td><td>'+activitesHTML+'</td></tr>';
    occurrences.push({'id': o, 'trimestre': suividata.trimestre, 'jeunes': jeunesOcc, 'activites': actisOcc, 'jeunestotal': 0, 'activitestotal': doneActis});
    buttonsJeunesId.push(occ);
}

var changed = function(instance, cell, x, y, value) {
    let sel  = spreadsheet.getSelectedRows(true)[0];
    document.getElementById('modif').classList.add('disp');
    suividata = {'id': sel, 'trimestre': suivis[sel].trimestre, 'occurrences': suivis[sel].occurrences, 'jeunes': suivis[sel].jeunes, 'activites': suivis[sel].activites};
    document.getElementById('occurrencesBody').innerHTML = "";
    for (let o=0;o<suividata.occurrences;o++) {
	createRow(o);
    }
    document.getElementById('modif').classList.remove('disp');
    document.getElementById('submitbutton').disabled = false;
}

var selected = function(instance, x1, y1, x2, y2, origin) {
    if (x1==x2) {
	spreadsheet.updateSelectionFromCoords(0,y1,3,y1);
	changed();
    }
}

function addRow() {
    let o = suividata.occurrences
    createRow(o);
    suividata.occurrences += 1;
}

function removeFromArray(arr,id) {
    for (let i=0;i<arr.length;i++) {
	if(arr[i].id == id) {
	    arr.splice(i,1);
	    break;
	}
    }
}

function delRow() {
    let checkboxes = document.querySelectorAll('.cbselect');
    console.log(checkboxes);
    for (let c=checkboxes.length-1; c>=0; c--) {
	if (checkboxes[c].id.slice(0,2) == 'cb' && checkboxes[c].checked) {
	    document.getElementById('occurrences').deleteRow(c+2);
	    removeFromArray(occurrences,c);
	    suividata.occurrences -= 1;
	}
    }
}

async function appendSuivi(occ) {
    let options = {
      method: 'POST',
      headers: {
	accept: 'application/json',
	'content-type': 'application/json',
	authorization: 'Bearer ' + base_bearer
      },
      body: JSON.stringify({row: {Trimestre: occ.trimestre, Occurrences: -1}, table_name: 'Suivi'})
    };
    console.log('createRow');
    console.log(options);
    await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/rows/', options)
      .then(response => response.json())
      .then(function(response) {
	     fromSend(response,occ);
      })
      .catch(err => console.error(err));
}

async function send() {
    modifsOccurrences = []
    for (let o=0;o<occurrences.length;o++) {
	if (occurrences[o].jeunestotal>0 && occurrences[o].activitestotal>0) {
	    modifsOccurrences.push(occurrences[o]);
	}
    }
    const promises = modifsOccurrences.map(appendSuivi);
    await Promise.all(promises)
      .then(responses => {
	final(responses);
      });
}

async function final(response) {
    if (response) {
	success += 1;
    }
    if (success == modifsOccurrences.length) {
	document.getElementById('successResult').innerHTML='<b>Les données du suivi ont été transférées correctement !</b>';
	window.scrollTo(0, document.body.scrollHeight);
    }
}

/*async function next(response) {
    if (response) {
	success += 1;
    }
    if (success == modifsOccurrences.length) {
	for (let r=0;r<rows.length;r++) {
	    let activites = []
	    for (let a=0;a<rows[r].occ.activites.length;a++) {
		if (rows[r].occ.activites[a].done) {
		    activites.push(rows[r].occ.activites[a].row_id);
		}
	    }
	    const options = {
	      method: 'PUT',
	      headers: {
		accept: 'application/json',
		'content-type': 'application/json',
		authorization: 'Bearer ' + base_bearer
	      },
	      body: JSON.stringify({
		table_name: 'Suivi',
		other_table_name: 'Activités',
		link_id: 'KJ79',
		row_id: rows[r].id,
		other_rows_ids: activites
	      })
	    };

	    await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/links/', options)
	      .then(response => response.json())
	      .then(function(response) {
		     final(response);
	      })
	      .catch(err => console.error(err));
	}
	/*document.getElementById('successResult').innerHTML='<b>Les données du suivi ont été transférées correctement !</b>';
	window.scrollTo(0, document.body.scrollHeight);*/
   /* }
}*/

async function fromSend(response,occ) {
    let jeunes = [];
    for (let j=0;j<occ.jeunes.length;j++) {
	if (occ.jeunes[j].abs) {
	    jeunes.push(occ.jeunes[j].row_id);
	}
    }
    let origId = response._id;
      
    let options = {
      method: 'PUT',
      headers: {
	accept: 'application/json',
	'content-type': 'application/json',
	authorization: 'Bearer ' + base_bearer
      },
      body: JSON.stringify({
	table_name: 'PEDA_Suivis',
	other_table_name: 'Jeunes',
	link_id: '2FR9',
	row_id: origId,
	other_rows_ids: jeunes
      })
    };
    console.log('linkUsers');
    console.log(options);
    await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/links/', options)
      .then(response => response.json())
      .then(function(response) {
	      fromLinkJeunes(response,origId,occ);
      })
      .catch(err => console.error(err));
}

async function fromLinkJeunes(response,origId,occ) {
    let activites = []
    for (let a=0;a<occ.activites.length;a++) {
	if (occ.activites[a].done) {
	    activites.push(occ.activites[a].row_id);
	}
    }
    let options = {
      method: 'PUT',
      headers: {
	accept: 'application/json',
	'content-type': 'application/json',
	authorization: 'Bearer ' + base_bearer
      },
      body: JSON.stringify({
	table_name: 'PEDA_Suivis',
	other_table_name: 'PEDA_Activites',
	link_id: 'KJ79',
	row_id: origId,
	other_rows_ids: activites
      })
    };
    console.log('linkActivities');
    console.log(options);
    await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/links/', options)
      .then(response => response.json())
      .then(function(response) {
	     final(response);
      })
      .catch(err => console.error(err));
}
