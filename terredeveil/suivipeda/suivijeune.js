var compFilled = false;
var cansubmit = false;
var base_bearer = '';
var ids = [];
let competences = [];
let jeunes = [];
let jeune = null;
let saisieEnCours = false;
let data = [];
var domaines = [];
let toGenerate = false;
spreadsheet = null;
let cyclesAImprimer = [];

async function initsuivijeune() {
  if (bearer) {
      setInputState(false);
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
	listJeunes();
      }
  }
};

async function fromBearer(resp) {
  base_bearer = resp.access_token;
  var date = new Date();
  date.setDate(date.getDate() + 3);
  localStorage.setItem("SeaTableExpirationDate",date);
  localStorage.setItem("SeaTableBearer",base_bearer);
  listJeunes();
};

async function updateJeune(id) {
    const options = {
      method: 'GET',
      headers: {
	    accept: 'application/json',
	    authorization: 'Bearer '+base_bearer
      }
      };
  await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/rows/'+id+'/?table_name=Jeunes&view_name=Suivi%20Peda', options)
  .then(response => response.json())
  .then(function(response) {
	 for (let j=0;j<jeunes.length;j++) {
	     if (response._id == jeunes[j].id) {
		 jeunes[j].lastupdate = response['MaJCompetences'];
		 jeunes[j].appreciation = response['Appreciation'];
		 jeunes[j].bilan = response['DernierBilan'];
		 break;
	     }
	 }
	 setInputState(false);
	 select_jeune();
  })
  .catch(err => console.error(err));
}

async function listJeunes() {
    const options = {
      method: 'GET',
      headers: {
	    accept: 'application/json',
	    authorization: 'Bearer '+base_bearer
      }
      };
  await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/rows/?table_name=Jeunes&view_name=Suivi%20Peda', options)
  .then(response => response.json())
  .then(function(response) {
	 fromJeunes(response);
  })
  .catch(err => console.error(err));
}

async function fromJeunes(resp) {
    for(let i=0;i<resp.rows.length;i++) {
	    await jeunes.push({"id" : resp.rows[i]._id, "nom": resp.rows[i].Nom, "bilan": resp.rows[i]['DernierBilan'], "appreciation": resp.rows[i]['Appreciation'], "lastupdate": resp.rows[i]['MaJCompetences']});
      }
      for(let i=0;i<jeunes.length;i++) {
		var opt = document.createElement('option');
		opt.value = jeunes[i].id;
		opt.innerHTML = jeunes[i].nom;
		await document.getElementById('jeune').appendChild(opt);
      }
      document.getElementById('jeune').selectedIndex = 0;
      document.getElementById('jeune').disabled = false;
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

async function fromComp(resp) {
    for(let i=0;i<resp.rows.length;i++) {
	    await competences.push({"id" : resp.rows[i]._id, "domaine_id": resp.rows[i].Id_compétence.match(/[A-Z]*/g)[0], "domaine": resp.rows[i].Domaine, "cycle": resp.rows[i].Cycle, "identifiant" : resp.rows[i].Identifiant, "intitulé" : resp.rows[i].Intitulé_compétence, "id_connaissance": resp.rows[i].Connaissance, "connaissance" : resp.rows[i]["Connaissances et compétences associées"]});
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
      setInputState(true);
}

async function select_jeune() {
    setInputState(false);
    const options = {
      method: 'GET',
      headers: {
	    accept: 'application/json',
	    authorization: 'Bearer '+base_bearer
      }
    };
  let nomJeuneTable = '';
  for (let j=0;j<jeunes.length;j++) {
      if (document.getElementById('jeune').options[document.getElementById('jeune').selectedIndex].value == jeunes[j].id) {
	  jeune = jeunes[j];
	  /*if (jeunes[j].lastupdate==null) {
	      document.getElementById('dateupdatecompetences').innerHTML = '<b>Mettez impérativement à jour les compétences en cliquant sur ce bouton !</b>&nbsp;&nbsp;&nbsp;<span><input type="button" id="updatecompsbutton" value="Mettre à jour" onclick="updateComps()" style="color: white; font-weight: bold;">';
	  }
	  else {
	    document.getElementById('dateupdatecompetences').innerHTML = 'Date de dernière mise à jour des compétences : '+new Date(jeunes[j].lastupdate).toLocaleDateString() +'&nbsp;&nbsp;&nbsp;<span><input type="button" id="updatecompsbutton" value="Mettre à jour" onclick="updateComps()" style="color: white; font-weight: bold;">';
	  }*/
	  if (jeunes[j].bilan != null) {
	      document.getElementById('dernierbilan').innerHTML = 'Date du dernier bilan : '+new Date(jeunes[j].bilan).toLocaleDateString();
	  }
	  else {
	      document.getElementById('dernierbilan').innerHTML = '';
	  }
	  if (jeunes[j].appreciation != null) {
	      document.getElementsByClassName('ql-editor')[0].innerHTML = converter.makeHtml(jeunes[j].appreciation);
	      updateContent();
	  }
	  else {
	      document.getElementsByClassName('ql-editor')[0].innerHTML = '';
	  }
	  nomJeuneTable=document.getElementById('jeune').options[document.getElementById('jeune').selectedIndex].text.replaceAll(" ","").replaceAll("-","").replaceAll("/","");
	  break;
      }
  }
  document.getElementById('cycle').disabled = false;
  document.getElementById('domaine').disabled = false;
  await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/rows/?table_name=PEDA_Competences_'+encodeURI(nomJeuneTable)+'&view_name=Toutes%20les%20comp%C3%A9tences', options)
  .then(response => response.json())
  .then(function(response) {
	 fromJeuneComps(response);
  })
  .catch(err => console.error(err));
    
}

function fromJeuneComps(resp) {
    for(let i=0;i<resp.rows.length;i++) {
	let comp = null;
	for (let j=0;j<competences.length;j++) {
	    if (resp.rows[i]._id == competences[j].id) {
		comp = competences[j];
		break;
	    }
	}
	if (comp != null) {
	    comp['prec'] = resp.rows[i]['années précédentes'];
	    let trim1 = 0;
	    let trim2 = 0;
	    let trim3 = 0;
	    comp['trim1'] = resp.rows[i]['trim1']; 
	    comp['trim2'] = resp.rows[i]['trim2'];
	    comp['trim3'] = resp.rows[i]['trim3']; 
	    if (resp.rows[i]['trim1']!=null) { trim1 = resp.rows[i]['trim1'];}
	    if (resp.rows[i]['trim2']!=null) { trim1 = resp.rows[i]['trim2'];}
	    if (resp.rows[i]['trim3']!=null) { trim1 = resp.rows[i]['trim3'];}
	    comp['acquis'] = resp.rows[i]['acquis'];
	    comp['eca'] = trim1+trim2+trim3>0;
	}
    }
    change_vue();
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

function updateComps() {
    setInputState(false);
    let data = new FormData();
    data.append('request','update_comps');
    data.append('id',document.getElementById('jeune').selectedOptions[0].value);
    fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/cdfcda55-c818-454e-bab4-cdfe96b43ff9", {
      method: "POST",
      body: data
    }).then(response=> response.json())
      .then(function(data) {
	  if (data.success=="true") {
	      updateJeune(document.getElementById('jeune').selectedOptions[0].value);
	  }
    });
}

function setInputState(state) {
    if (state) { 
	document.getElementById('loaderup').classList.add('disp');
	document.getElementById('loaderbottom').classList.add('disp'); 
    }
    else { 
	document.getElementById('loaderup').classList.remove('disp');
	document.getElementById('loaderbottom').classList.remove('disp');
    }
    document.querySelectorAll("input").forEach((element) => element.disabled=!state);
    document.querySelectorAll("select").forEach((element) => element.disabled=!state);
}

function getCheckedCheckboxesFor(checkboxName) {
    var checkboxes = document.querySelectorAll('input[name="' + checkboxName + '"]:checked'), values = [];
    Array.prototype.forEach.call(checkboxes, function(el) {
        values.push(el.value);
    });
    return values;
}

function generate() {
    document.getElementById('successResult').innerHTML = "";
    cyclesAImprimer = getCheckedCheckboxesFor('cycleaimprimer');
	if (cyclesAImprimer.length>0) {
	toGenerate = true;
	send();
    } else {
	document.getElementById('successResult').innerHTML="Veuillez sélectionner <b>au moins un cycle ci-dessus</b> dont les compétences acquises/en cours d'acquisition seront affichées dans le rapport";
    }
}

function toggleLabel(evt) {
    document.getElementById('label'+evt.target.value).classList.toggle('selected');
}

var changed = function(instance, cell, x, y, value) {
    var compName = spreadsheet.getValueFromCoords(0,y);
    if (spreadsheet.getHeader(x) == "ACQ") {
	for (let c=0;c<competences.length;c++) {
	    if (competences[c].identifiant == compName) {
		competences[c].acquis = spreadsheet.getValueFromCoords(x,y);
		console.log(c);
		break;
	    }
	}
	for (let d=0;d<data.length;d++) {
	    if (data[d].identifiant == compName) {
		data[d].acquis = spreadsheet.getValueFromCoords(x,y);
		break;
	    }
	}
    }
    if (spreadsheet.getHeader(x) == "1er trim") {
	for (let c=0;c<competences.length;c++) {
	    if (competences[c].identifiant == compName) {
		competences[c].trim1 = spreadsheet.getValueFromCoords(x,y);
		break;
	    }
	}
	for (let d=0;d<data.length;d++) {
	    if (data[d].identifiant == compName) {
		data[d].trim1 = spreadsheet.getValueFromCoords(x,y);
		break;
	    }
	}
    }
}

function change_vue() {
    data=[];
    const domaine = document.getElementById('domaine').value;
    const cycle = document.getElementById('cycle').value;
    for (let c=0;c<competences.length;c++) {
	if (document.getElementById('vue').value == 'all' || (document.getElementById('vue').value == 'occur' && competences[c].eca == true)) {
	    if (domaine == "none" || (domaine != "none" && competences[c].domaine_id == domaine)) {
		if (cycle == "none" || (cycle != "none" && competences[c].cycle == cycle)) {
		    data.push({'identifiant': competences[c].identifiant, 'domaine': wrapText(competences[c].domaine), 'domaine_id': competences[c].domaine_id,'intitulé': wrapText(competences[c]['intitulé']),'cycle': competences[c].cycle,'id_connaissance': competences[c].id_connaissance,'connaissance': wrapText(competences[c].connaissance),'prec': competences[c].prec,'trim1': competences[c].trim1,'trim2': competences[c].trim2,'trim3': competences[c].trim3, 'acquis': competences[c].acquis});
		}
	    }
	}
    }
    if (spreadsheet == null) {
	spreadsheet = jspreadsheet(document.getElementById('spreadsheet'), {
	    data:data,
	    columns: [
		{ type: 'text', title:'Ident.', 'name': 'identifiant', readOnly:true, width:60 },
		{ type: 'text', title:'Domaine', 'name': 'domaine', readOnly:true, wrap: true, width:208 },
		{ type: 'text', title:'Id comp.', 'name': 'domaine_id', readOnly:true, width:37 },
		{ type: 'text', title:'Intitulé compétence', 'name': 'intitulé', readOnly:true, wrap: true, width:255 },
		{ type: 'text', title:'Cycle', 'name': 'cycle', readOnly:true, width:28 },
		{ type: 'text', title:'Id conn.', 'name': 'id_connaissance', readOnly:true, width:18 },
		{ type: 'text', title:'Connaissances et compétences associées', 'name': 'connaissance', readOnly:true, wrap: true, width:255 },
		{ type: 'text', title:'Années préc.', 'name': 'prec', readOnly:true, width:90 },
		{ type: 'numeric', title:'1er trim', 'name': 'trim1', width:40, mask:'0' }, //readOnly:true, width:40 }
		{ type: 'numeric', title:'2è trim', 'name': 'trim2', width:40, mask:'0' },
		{ type: 'numeric', title:'3è trim', 'name': 'trim3', width:40, mask:'0' },
		{ type: 'checkbox', title:'ACQ', 'name': 'acquis', width:40 },
	     ],
	    filters: true,
	    allowInsertRow: false,
	    allowDeleteRow: false,
	    onchange: changed,
	});
	spreadsheet.hideIndex();
    }
    else {
	spreadsheet.setData(data);
    }
    setInputState(true);
}

async function transfert() {
    function objectwithoutID(obj) {
	let res = {};
	for (let k=0;k<Object.keys(obj).length;k++) {
	    if (Object.keys(obj)[k] != 'id') {
		res.Object.keys(obj)[k]  = Object.values(obj)[k];
	    }
	}
	return res;
    }
    function update(arr,updates=null) {
	for (let a=0;a<arr.length;a++) {
	    let trim1 = 0;
	    let trim2 = 0;
	    let trim3 = 0;
	    if (arr[a].trim1!=null) {
		trim1 = arr[a].trim1;
	    }
	    if (arr[a].trim2!=null) {
		trim2 = arr[a].trim2;
	    }
	    if (arr[a].trim3!=null) {
		trim3 = arr[a].trim3;
	    }
	    if(arr[a].acquis) {
		arr[a].prec = "acquis";
	    }
	    else if (trim1+trim2+trim3>0) {
		arr[a].prec = "en cours d'acquisition";
	    }
	    else if (arr[a].prec==null || arr[a].prec==""){
		arr[a].prec = "non évalué";
	    }
	    arr[a].trim1==null;
	    arr[a].trim2==null;
	    arr[a].trim3==null;
	    if(updates!=null) {
		updates.push({'row_id':arr[a].id,'row':objectwithoutID(arr[a])})
	    }
	}
	console.log(updates);
    }
    if(jeune!=null) {
	let updates = [];
	updateArray(competences,updates);
	updateArray(data);
	spreadsheet.setData(data);
	const options = {
	  method: 'PUT',
	  headers: {
	    accept: 'application/json',
	    'content-type': 'application/json',
	    authorization: 'Bearer ' + base_bearer
	  },
	  body: JSON.stringify({
	    updates: updates,
	    table_name: 'PEDA_Competences_'+jeune.nom.replaceAll(" ","")
	  })
	};

	let transfertResponse = await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/batch-update-rows/', options)
	  .then(response => response.json())
	  .then(function(response) {
		 final(response);
	  })
	  .catch(err => console.error(err));
    }
}

function updateContent() {
    document.getElementById('text').value = document.getElementsByClassName('ql-editor')[0].innerHTML;
}

async function send() {
 setInputState(false);
 var success = true;
 if (jeune != null) {
	const options = {
	  method: 'PUT',
	  headers: {
	    accept: 'application/json',
	    'content-type': 'application/json',
	    authorization: 'Bearer '+base_bearer
	  },
	  body: JSON.stringify({
	    row: {
		'DernierBilan': new Date(),
		'Appreciation': turndownService.turndown(document.getElementById('text').value), //document.getElementById('eval').innerText
		'CyclesAImprimer': cyclesAImprimer
	    },
	    table_name: 'Jeunes',
	    row_id: jeune.id
	  })
	};

	fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/rows/', options)
	  .then(response => response.json())
	  .then(function(response) {
		 fromSend(response);
	  })
	  .catch(err => console.error(err));
	    }
	}

async function final(response) {
    if (response) {
	if (!toGenerate) { 
	    document.getElementById('successResult').innerHTML='<b>Les données du/de la jeune ont été transférées correctement !</b>';
	    window.scrollTo(0, document.body.scrollHeight);
	    setInputState(true);
	}
	else {
	    let data = new FormData();
	    data.append('request','generate');
	    data.append('id',document.getElementById('jeune').selectedOptions[0].value);
	    fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/cdfcda55-c818-454e-bab4-cdfe96b43ff9", {
	      method: "POST",
	      body: data
	    }).then(response => response.arrayBuffer())
	      .then(function(response) {
		var blob = new Blob([response], {type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
		var objectUrl = URL.createObjectURL(blob);
		const downloadLink = document.createElement("a");
		downloadLink.href = objectUrl;
		downloadLink.download = 'suivi_competences_'+jeune.nom.replaceAll(" ","").replaceAll("-","").replace("/","")+(new Date()).toLocaleDateString().replaceAll('/','-')+'.docx';
		downloadLink.click();
		setInputState(true);
		toGenerate = false;
		document.getElementById('successResult').innerHTML = "Le rapport a été correctement généré et téléchargé !"
	    });
	}
    }
}

async function fromSend(response) {
    if (jeune != null) {
	let updates = [];
	for (let c=0;c<competences.length;c++) {
	    updates.push({'row_id': competences[c].id, 'row':{'acquis': competences[c].acquis, 'trim1': competences[c].trim1,'trim2': competences[c].trim2, 'trim3': competences[c].trim3}})
	}
	const options = {
	      method: 'PUT',
	      headers: {
		accept: 'application/json',
		'content-type': 'application/json',
		authorization: 'Bearer ' + base_bearer
	      },
	      body: JSON.stringify({
		updates: updates,
		table_name: 'PEDA_Competences_'+jeune.nom.replaceAll(" ","").replaceAll("-","").replace("/",""),
	      })
	};

	let transfertResponse = await fetch(server+'/dtable-server/api/v1/dtables/'+base_uuid+'/batch-update-rows/', options)
	  .then(response => response.json())
	  .then(function(response) {
		 final(response);
	  })
	  .catch(err => console.error(err));
  }
}
