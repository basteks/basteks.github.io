var compFilled = false;
var cansubmit = false;
var base_bearer = '';
var ids = [];
var competences = [];
var domaines = [];
let saisieEnCours = false;

async function initnouvelleactivite() {
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
	listComps();
      }
  }
};

function updateContent() {
    document.getElementById('text').value = document.getElementsByClassName('ql-editor')[0].innerHTML;
}

async function fromBearer(resp) {
  base_bearer = resp.access_token;
  var date = new Date();
  date.setDate(date.getDate() + 3);
  localStorage.setItem("SeaTableExpirationDate",date);
  localStorage.setItem("SeaTableBearer",base_bearer);
  listComps()
};

async function listComps() {
    const options = {
      method: 'GET',
      headers: {
	    accept: 'application/json',
	    authorization: 'Bearer '+base_bearer
      }
      };
  await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/rows/?table_name=PEDA_Competences&view_name=Listing', options)
  .then(response => response.json())
  .then(function(response) {
	 fromComp(response);
  })
  .catch(err => console.error(err));
}

function checkform()
{
	cansubmit = compFilled && document.getElementById('intitule').value!="";
	if (cansubmit) {
		document.getElementById('submitbutton').disabled = !cansubmit;
	}
};

async function fromComp(resp) {
    for(let i=0;i<resp.rows.length;i++) {
	    await competences.push({"id" : resp.rows[i]._id, "domaine_id": resp.rows[i].Id_compétence.match(/[A-Z]*/g)[0], "domaine": resp.rows[i].Id_compétence.match(/[A-Z]*/g)[0]+" : "+resp.rows[i].Domaine, "cycle": resp.rows[i].Cycle, "identifiant" : resp.rows[i].Identifiant, "intitulé" : resp.rows[i].Intitulé_compétence, "connaissance" : resp.rows[i]["Connaissances et compétences associées"]});
	    if (domaines.indexOf(resp.rows[i].Id_compétence.match(/[A-Z]*/g)[0]+" : "+resp.rows[i].Domaine)==-1) {
		domaines.push(resp.rows[i].Id_compétence.match(/[A-Z]*/g)[0]+" : "+resp.rows[i].Domaine);
	    }
      }
      for(let i=0;i<domaines.length;i++) {
		var opt = document.createElement('option');
		opt.value = domaines[i].split(" : ")[0];
		opt.innerHTML = domaines[i];//.split(" : ")[1];
		await document.getElementById('domaine').appendChild(opt);
      }
      document.getElementById('loader').classList.add('disp');
}

function auto_modif() {
    saisieEnCours = true;
    auto_complete();
}

function auto_complete() {
    let valid = [];
    const lastInput = document.getElementById('competences').value.replaceAll(" ","").split(",")[document.getElementById('competences').value.replaceAll(" ","").split(",").length-1];
    const domaine = document.getElementById('domaine').value;
    const cycle = document.getElementById('cycle').value;
    let connaissance = false;
    for (let i=0;i<competences.length;i++) {
	let compTest = false;
	let domTest = false;
	let cyTest = false;
	if ( !saisieEnCours || (saisieEnCours && (lastInput.length<2 || (lastInput.length>=2 && competences[i].identifiant.slice(0,lastInput.length)==lastInput)))) {
	    compTest = true;
	}
	if (domaine == "none" || (domaine != "none" && competences[i].domaine_id == domaine)) {
	    domTest = true;
	}
	if (cycle == "none" || (cycle != "none" && competences[i].cycle == cycle)) {
	    cyTest = true;
	}
	if (compTest && domTest && cyTest) {
	    valid.push(competences[i]);
	    if (competences[i].connaissance != null) {
		connaissance = true;
	    }
	}
    }

    if ((lastInput.length>1 || document.getElementById('cycle').selectedIndex>0 || document.getElementById('domaine').selectedIndex>0 ) && valid.length>0) {
	if (connaissance) {
	    document.getElementById('validHeaders').innerHTML = '<th>Identifiant</th><th>Domaine</th><th>Cycle</th><th>Intitulé compétence</th><th>Connaissances et compétences associées<span style="float:right;"><button type="button" class="cancel" onclick="closeForm()">X</button></span></th>';
	}
	else {
	    document.getElementById('validHeaders').innerHTML = '<th>Identifiant</th><th>Domaine</th><th>Cycle</th><th>Intitulé compétence<span style="float:right;"><button type="button" class="cancel" onclick="closeForm()">X</button></span></th>';
	}
	document.getElementById("validComps").innerHTML = "";
	for (let j=0;j<valid.length;j++){
	    if (connaissance && valid[j].connaissance != null) {
		document.getElementById("validComps").innerHTML += '<tr style="cursor: pointer;" onclick="addComp('+"'"+valid[j].identifiant.toString()+"'"+')"><td>'+valid[j].identifiant+"</td><td>"+valid[j].domaine+"</td><td>"+valid[j].cycle+"</td><td>"+valid[j].intitulé+"</td><td>"+valid[j].connaissance+'</td></tr>';
	    }
	    else {
		document.getElementById("validComps").innerHTML += '<tr style="cursor: pointer;" onclick="addComp('+"'"+valid[j].identifiant.toString()+"'"+')"><td>'+valid[j].identifiant+"</td><td>"+valid[j].domaine+"</td><td>"+valid[j].cycle+"</td><td>"+valid[j].intitulé+"</td></tr>";
	    }
	}
	openForm();
    }
    else {
	closeForm();
    }
}

function addComp(comp) {
    newEntry = "";
    const lastInput = document.getElementById('competences').value.replaceAll(" ","").split(",")[document.getElementById('competences').value.replaceAll(" ","").split(",").length-1];
    const entry = document.getElementById('competences').value.replaceAll(" ","").split(",");
    const lastElem = saisieEnCours ? entry.length-1:entry.length;
    for (let i=0;i<lastElem;i++) {
	if (entry[i]!="") {
	    newEntry += entry[i]+", ";
	}
    }
    newEntry += comp;
    document.getElementById('competences').value = newEntry;
    saisieEnCours = false;
    closeForm();
}

function check_competences() {
    function findComp(comp) {
	var result = competences.filter(competence => {
	  return competence.identifiant === comp
	})
	if (result.length==1) {
		if (document.getElementById('compres').innerHTML=="") {
			document.getElementById('compres').innerHTML = "<b>Liste des compétences de la base liées à votre <i>saisie</i> :</b><ul>";
		}
		if (result[0].connaissance != null) {
		    document.getElementById('compres').innerHTML += "<li><i>"+comp+"</i> => "+result[0].identifiant+" : "+result[0].intitulé+" / " + result[0].connaissance.substr(0, 50)+"..."+"</li>";
		}
		else {
		    document.getElementById('compres').innerHTML += "<li><i>"+comp+"</i> => "+result[0].identifiant+" : "+result[0].intitulé+"</li>";
		}
		ids.push(result[0].id);
	}
	else {
		compsNotFound.push(comp);
	}
    }
    ids = [];
    document.getElementById('compres').innerHTML="";
    document.getElementById('comperror').innerHTML ="";
    let saisieComps = document.getElementById("competences").value.replaceAll(" ","").split(",");
    saisieComps = [...new Set(saisieComps)];
    let compsNotFound = [];
    for (let c=0;c<saisieComps.length;c++) {
	    //console.log (saisieComps[c]);
	    if (saisieComps[c].split('-').length==2) {
		const endComp = saisieComps[c][saisieComps[c].length-1];
		const startComp = saisieComps[c][saisieComps[c].length-3];
		const alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
		for (let i=alphabet.indexOf(startComp);i<alphabet.indexOf(endComp)+1;i++) {
		    findComp(saisieComps[c].slice(0,saisieComps[c].length-3)+alphabet[i]);
		}
	    }
	    else if (saisieComps[c].split('-').length>2) {
		const Comp = saisieComps[c].split('-')[0].slice(0,saisieComps[c].split('-')[0].length-1);
		findComp(saisieComps[c].split('-')[0]);
		for (let i=1;i<saisieComps[c].split('-').length;i++) {
		    findComp(Comp+saisieComps[c].split('-')[i]);
		}
	    }
	    else {
		findComp(saisieComps[c]);
	    }
	    /*
	    var result = competences.filter(comp => {
	      return comp.identifiant === saisieComps[c]
	    })
	    if (result.length==1) {
		    //console.log(result[0]);
		    if (document.getElementById('compres').innerHTML=="") {
			    document.getElementById('compres').innerHTML = "<b>Liste des compétences de la base liées à votre <i>saisie</i> :</b><ul>";
		    }
		    if (result[0].connaissance != null) {
			document.getElementById('compres').innerHTML += "<li><i>"+saisieComps[c]+"</i> => "+result[0].identifiant+" : "+result[0].intitulé+" / " + result[0].connaissance.substr(0, 50)+"..."+"</li>";
		    }
		    else {
			document.getElementById('compres').innerHTML += "<li><i>"+saisieComps[c]+"</i> => "+result[0].identifiant+" : "+result[0].intitulé+"</li>";
		    }
		    ids.push(result[0].id);
	    }
	    else {
		    compsNotFound.push(saisieComps[c]);
	    }*/
    }
    document.getElementById('compres').innerHTML += "</ul>";
    if (compsNotFound.length>0) {
	    if (compsNotFound.length==1) {
		    document.getElementById('comperror').innerHTML = "<b>Attention, la <i>saisie</i> suivante n'a pu être liée à aucune compétence de la base, merci de vérifier votre saisie : </b><i>"+compsNotFound[0]+"</i>";
	    }
	    else {
		    document.getElementById('comperror').innerHTML = "<b>Attention, les <i>saisies</i> suivantes n'ont pu être liées à aucune compétence de la base, merci de vérifier vos saisies :</b><ul>";
		    for (let e=0;e<compsNotFound.length;e++) {
			    document.getElementById('comperror').innerHTML +="<li><i>"+compsNotFound[e]+"</i></li>";
		    }
		    document.getElementById('comperror').innerHTML += "</ul>";
	    }
	    compFilled = false;
	    checkform();
    }
    else {
	    compFilled = true;
	    checkform();
    }
    window.scrollTo(0, document.body.scrollHeight);	
}

function openForm() {
  document.getElementById("compPopup").style.display = "block";
}

function closeForm() {
  document.getElementById("compPopup").style.display = "none";
}

async function fromLink(response) {
    if (response) {
	document.getElementById('compres').innerHTML="";
	document.getElementById('comperror').innerHTML ="";
	document.getElementById('dummy').style.minHeight = "0px"
	document.getElementById('dummy').style.maxHeight = "0px"
	document.getElementById('successResult').innerHTML='<b>Votre activité a été saisie correctement !</b>';
	document.getElementById('reload').classList.remove('disp');
	document.getElementById('loader').classList.add('disp');
	window.scrollTo(0, document.body.scrollHeight);
    }
}

async function fromSend(response) {
    const origId = response._id;
  
    const options2 = {
      method: 'PUT',
      headers: {
	accept: 'application/json',
	'content-type': 'application/json',
	authorization: 'Bearer '+base_bearer
      },
      body: JSON.stringify({
	link_id: '5LpD',
	table_name: 'PEDA_Activites',
	other_table_name: 'PEDA_Competences',
	row_id: origId,
	other_rows_ids: ids
      })
    };

    let linkResponse = await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/links/', options2)
      .then(response => response.json())
      .then(function(response) {
	     fromLink(response);
      })
      .catch(err => console.error(err));
}

async function send() {
  document.getElementById('loader').classList.remove('disp');
  document.getElementById('submitbutton').disabled = true;
 const options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    authorization: 'Bearer '+base_bearer
  },
  body: JSON.stringify({
    row: {
	Matière: document.getElementById('matiere').value,
	Catégorie: document.getElementById('categorie').value,
	Module: document.getElementById('module').value,
	Intitulé: document.getElementById('intitule').value,
	Déroulé: turndownService.turndown(document.getElementById('text').value), //document.querySelector('[contenteditable]').innerText,
	SousTitre: document.getElementById('subtitle').value
    }, 
    table_name: 'PEDA_Activites'
  })
};
  let rowResponse = await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/rows/', options)
  .then(response => response.json())
  .then(function(response) {
 	 fromSend(response);
  })
  .catch(err => console.error(err));
}
