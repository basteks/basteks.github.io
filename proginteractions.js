/* Global variables */
let debug = false;
let chosenDate = null;
let action = 'create';
let sallesData = [];
let filesList = [];
let atLeastOneEvent = false;
let eventID = null;

var canvas, ctx, flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    dot_flag = false,
    legend = true;
/* End of global variables */

/* File transfer functions */
function uploadFileList(e) {
    if (document.getElementById('files').files.length>0) {
	document.getElementById('fileList').style.display = "block";
	for (let f=0;f<document.getElementById('files').files.length;f++) {
	    let reader = new FileReader();
	    let name = document.getElementById('files').files[f].name;
	    let currFile = document.getElementById('files').files[f];
	    reader.readAsDataURL(document.getElementById('files').files[f]);
	    reader.onloadend = function () {
		filesList.push(currFile);
		var li = document.createElement('li', name);
		li.id = 'li'+name;
		li.style.lineHeight = '2em';
		li.style.marginTop = '10px';
		let fileIcon = document.createElement("i");
		fileIcon.style.fontSize = "64px";
		fileIcon.classList.add('fa');
		let fileLink = document.createElement("a");
		fileLink.target = "_blank";
		let dummy1 = document.createElement("span");
		dummy1.innerHTML = '&nbsp;&nbsp;&nbsp;';
		let dummy2 = document.createElement("span");
		dummy2.innerHTML = '&nbsp;&nbsp;&nbsp;';
		fileLink.href = reader.result;
		if (document.getElementById('files').files[f].type.indexOf('image')>-1 && document.getElementById('files').files[f].type.indexOf('svg')==-1) {
		    fileLink.innerHTML = '<img src="' + reader.result + '" height="100px;" alt="' + document.getElementById('files').files[f].name + ' (' + (document.getElementById('files').files[f].size/1000).toFixed(1) + ' kb)' + '">'; // var name
		} else {
		    fileLink.innerHTML = document.getElementById('files').files[f].name + ' (' + (document.getElementById('files').files[f].size/1000).toFixed(1) + ' kb)';
		    fileIcon.classList.add(getFontAwesomeIconFromMIME(document.getElementById('files').files[f].type));
		    li.appendChild(fileIcon);
		    li.appendChild(dummy1);
		}
		var btn = document.createElement("input");
		btn.type = "button";
		btn.classList.add("button");
		btn.onclick = function() { removeFileFromFileList(name); };
		btn.value = "Retirer";
		li.appendChild(fileLink);
		li.appendChild(dummy2);
		li.appendChild(btn);
		document.getElementById('fileList').appendChild(li);
	    }
	}
    }
}

function removeFileFromFileList(filename) {
  const dt = new DataTransfer();
  const input = document.getElementById('files');
  const { files } = input;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.name !== filename) {
      dt.items.add(file);
    } else {
	const index = filesList.indexOf(file);
	if (index > -1) {
	  filesList.splice(index, 1);
	}
    }
  }
  input.files = dt.files;
  var elem = document.getElementById('li'+filename);
  elem.parentNode.removeChild(elem);
}

function getFontAwesomeIconFromMIME(mimeType) {
  const icon_classes = {
    image: "fa-file-image-o",
    audio: "fa-file-audio-o",
    video: "fa-file-video-o",
    "application/pdf": "fa-file-pdf-o",
    "application/msword": "fa-file-word-o",
    "application/vnd.ms-word": "fa-file-word-o",
    "application/vnd.oasis.opendocument.text": "fa-file-word-o",
    "application/vnd.openxmlformats-officedocument.wordprocessingml":
      "fa-file-word-o",
    "application/vnd.ms-excel": "fa-file-excel-o",
    "application/vnd.openxmlformats-officedocument.spreadsheetml":
      "fa-file-excel-o",
    "application/vnd.oasis.opendocument.spreadsheet": "fa-file-excel-o",
    "text/plain": "fa-file-text-o",
    "text/html": "fa-file-code-o",
    "application/json": "fa-file-code-o",
    "application/gzip": "fa-file-archive-o",
    "application/zip": "fa-file-archive-o"
  };
  for (var key in icon_classes) {
    if (icon_classes.hasOwnProperty(key)) {
      if (mimeType.search(key) === 0) {
	return icon_classes[key];
      }
    } else {
      return "fa-file-o";
    }
  }
}
/* End of file transfer functions */


function calculatePAF() {
    if ( document.getElementById('hdispo').value && document.getElementById('hrestit').value) {
	//console.log('calculating PAF');
	let hdispo = document.getElementById('hdispo').valueAsDate;
	hdispo.setMinutes(hdispo.getMinutes() + hdispo.getTimezoneOffset());
	if (hdispo.getUTCHours()<12) {
	    hdispo.setUTCHours(0);
	}
	else { hdispo.setUTCHours(12); }
	let hrestit = document.getElementById('hrestit').valueAsDate;
	hrestit.setMinutes(hrestit.getMinutes() + hrestit.getTimezoneOffset());
	if (hrestit.getUTCHours()>=14) {
	    hrestit.setUTCHours(0);
	    hrestit.setUTCDate(hrestit.getUTCDate()+1);
	}
	else { hrestit.setUTCHours(12); }
	let nbdemijournees = Math.floor((hrestit - hdispo) / (1000*60*60*12));
	let PAF = 0;
	let PAFvariable = false;
	let minPAFvariable = 0;
	let pourcentagebenef = {};
	let nbSalles = 0;
	for (let salleid of Object.keys(sallesData)) {
	    let salle = sallesData[salleid];
	    if (salle.selected) {
		if (salle.tarification == 'prixlibre') {
		    PAF += salle.prixlibredemijournee * nbdemijournees;
		} else {
		    PAFvariable = true;
		    minPAFvariable += salle.prixplancher;
		    pourcentagebenef[salleid] = salle.pourcentagebenefices;
		}
		nbSalles += 1;
	    }
	}
	//TODO : période à affiner
	document.getElementById('pafnotice').style.display='none;'
	if (hdispo.getMonth()+1>=11 || hdispo.getMonth()+1<4 || hrestit.getMonth()+1>=11 || hrestit.getMonth()+1<4) {
	    PAF += nbSalles * nbdemijournees * 4;
	}
	let demijournee = nbdemijournees>1?("l'ensemble des " + nbdemijournees + " demi-journées concernées."):"la demi-journée concernée."
	if (PAF>0) {
	    document.getElementById('pafnotice').innerHTML = 'Pour votre évènement, la PAF prix coûtant (espaces + chauffage éventuel, sans électricité) est calculée à ' + PAF + "€ pour " + demijournee;
	} else if (PAFvariable) {
	    document.getElementById('pafnotice').innerHTML = 'Pour votre évènement, la PAF prix coûtant (espaces + chauffage éventuel, sans électricité) est calculée comme suit :';
	}
	if (PAFvariable) {
	    let PAFFixeStr = ' ';
	    if (PAF>0) {
		PAFFixeStr = '<b>également</b> ';
	    }
	    document.getElementById('pafnotice').innerHTML += "<br>Votre utilisation prévoit " + PAFFixeStr + "une part variable de participation. Celle-ci s'élèvera au minimum à " + minPAFvariable + "€ ou, pour la/les salle(s) suivante(s):<ul>";
	    for (let benef of Object.keys(pourcentagebenef)) {
		//console.log(benef);
		let salleStr = benef=="cuisine"?"Cuisine : ":"Bar associatif : ";
		document.getElementById('pafnotice').innerHTML += "<li style='margin-left:15px;'>" + salleStr + pourcentagebenef[benef]*100 + "% des bénéfices</li>";
	    }
	    document.getElementById('pafnotice').innerHTML += "</ul>";
	}
	document.getElementById('pafnotice').style.display='block;'
    }
}

function update(evt, tag) {
    //console.log('update ' + tag);
    if (document.getElementById('date').value != '') {
	if (tag == 'evt-room') {
	    if (chosenDate == null) { 
		chosenDate = new Date(document.getElementById('date').value);
		document.getElementById('hdispo').value = chosenDate.toISOString().slice(0, -8);
		document.getElementById('hrestit').value = chosenDate.toISOString().slice(0, -8);
	    }
	    else {
		if (document.getElementById('hdispo').value == chosenDate.toISOString().slice(0, -8)) {
		    document.getElementById('hdispo').value = new Date(document.getElementById('date').value).toISOString().slice(0, -8);
		}
		if (document.getElementById('hrestit').value == chosenDate.toISOString().slice(0, -8)) {
		    document.getElementById('hrestit').value = new Date(document.getElementById('date').value).toISOString().slice(0, -8);
		}
		chosenDate = new Date(document.getElementById('date').value);
	    }
	}
    }
    //if (eventID == null) {
	if (document.getElementById('hdispo').value != "") {
	    if (document.getElementById('hdebut').value == "") {
		let hdispoDate = document.getElementById('hdispo').valueAsDate;
		hdispoDate.setMinutes(hdispoDate.getMinutes() + hdispoDate.getTimezoneOffset());
		document.getElementById('hdebut').value = getDatetimeStr(hdispoDate); 
	    }
	    document.getElementById('hdebut').min = document.getElementById('hdispo').value;
	    document.getElementById('hfin').min = document.getElementById('hdispo').value;
	    document.getElementById('hrestit').min = document.getElementById('hdispo').value;
	}
	if (document.getElementById('hrestit').value != "") {
	    if (document.getElementById('hfin').value == "") {
		let hrestitDate = document.getElementById('hrestit').valueAsDate;
		hrestitDate.setMinutes(hrestitDate.getMinutes() + hrestitDate.getTimezoneOffset());
		document.getElementById('hfin').value = getDatetimeStr(hrestitDate);
		
	    }
	    document.getElementById('hdebut').max = document.getElementById('hrestit').value;
	    document.getElementById('hfin').max = document.getElementById('hrestit').value;
	    document.getElementById('hdispo').max = document.getElementById('hrestit').value;
	}
    //}
    let required = document.getElementsByClassName(tag + " reqfield");
    let canSubmit = true;
    for (let req of required) {
	if (req.value.length==0 && req.type!="email" && req.type!="checkbox" && req.type!="select-one" || req.type == "email" && !checkEmailFormat(req) || req.type == "checkbox" && !req.checked || req.type == "select-one" && req.value == "none") {
	    canSubmit = false;
//	    console.log('missing required ' + req.id);
	    if(req.type == "checkbox"){ console.log(req.checked); }
	    break;
	}
    }
    //console.log(canSubmit);
    checkHour();
    calculatePAF();
    document.getElementById('navbtn_'+tag+'_next').disabled = !(canSubmit || action=="update");
}

/* Multi-tab functions */
function openPage(evt, tag) {
  var i, x, tablinks;
  x = document.getElementsByClassName("page");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < x.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" w3-grey", "");
  }
  document.getElementById(tag).style.display = "block";
  document.getElementById("btn_"+tag).className += " w3-grey";
  if(tag=="evt-room"){
      openRoomTab(evt,'salle_survol_info','info');
  }
  update(evt, tag);
}

function prevStep(evt) {
    document.getElementById('btn_newcomer').style.display='none';
    document.getElementById('btn_org').style.display='block';
    document.getElementById('btn_evt-room').style.display='block';
    document.getElementById('btn_evt-info').style.display='block';
    document.getElementById('btn_com').style.display='block';
    document.getElementById('btn_recap').style.display='block';
    document.getElementById('btn_sign').style.display='block';
    openPage(evt,'intro');
}

function nextStep(evt) {
    if (document.getElementById('dejavenu').value == "oui") {
	openPage(evt,'org');
    }
    else {
	document.getElementById('btn_newcomer').style.display='block';
	document.getElementById('btn_org').style.display='none';
	document.getElementById('btn_evt-room').style.display='none';
	document.getElementById('btn_evt-info').style.display='none';
	document.getElementById('btn_com').style.display='none';
	document.getElementById('btn_recap').style.display='none';
	document.getElementById('btn_sign').style.display='none';
	openPage(evt,'newcomer');
    }
}

function openRoomTab(evt, tag, pagetype) {
  var i, x, tablinks;
  x = document.getElementsByClassName(pagetype+"page");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName(pagetype+"tablink");
  for (i = 0; i < x.length; i++) {
    tablinks[i].classList.remove("w3-grey");
    tablinks[i].classList.remove('displayed');
  }
  document.getElementById(tag).style.display = "block";
  document.getElementById(tag.split("_"+pagetype)[0]+"_"+pagetype+"btn").classList.add("w3-grey");
}
/* End of multi-tab functions */

/* Specific input functions */
function checkHour() {
    if (document.getElementById('hdebut').value != "" && document.getElementById('hdebut').valueAsDate<document.getElementById('hdispo').valueAsDate) {
	document.getElementById('hdebut').classList.add('wrong');
	document.getElementById('hdebut').title = "Choisissez au plus tôt le jour/l'heure de mise à disposition (" + document.getElementById('hdispo').value.replace('T',' ') + ")";
    } else {
	document.getElementById('hdebut').classList.remove('wrong');
	document.getElementById('hdebut').title = "";
    }
    if (document.getElementById('hfin').value != "" && document.getElementById('hfin').valueAsDate>document.getElementById('hrestit').valueAsDate) {
	document.getElementById('hfin').classList.add('wrong');
	document.getElementById('hfin').title = "Choisissez au plus tard le jour/l'heure de restitution (" + document.getElementById('hrestit').value.replace('T',' ') + ")";
    } else {
	document.getElementById('hfin').classList.remove('wrong');
	document.getElementById('hfin').title = "";
    }
}

function checkEmailFormat(elm){
    if (elm.value!= "" && /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(elm.value.toLowerCase())) {
	elm.classList.remove('wrong');
    }
    else {
	elm.classList.add('wrong');
    }
    return(elm.value!= "" && /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(elm.value.toLowerCase()));
}

function toggleRegEvent(evt) { // Toggle the "required" property for regular events
    let regfields = document.getElementsByClassName('regevt');
    for (regfield of regfields) {
	regfield.classList.toggle('legend');
	regfield.classList.toggle('reqfield');
    }
    update(evt,'evt-info');
}

function updateContent(evt) {
    document.getElementById('descriptionevt').value = document.getElementsByClassName('ql-editor')[0].innerHTML;
    update(evt,'com');
}

function updateMsgCuisine(evt) {
    if(document.getElementById('planchercuisine').selectedOptions[0].value == "oui") {
	document.getElementById('msgcuisine').innerHTML = "Pour une utilisation exclusive, un tarif plancher de " + sallesData['cuisine']['prixplancher'] + "€ ou " + sallesData['cuisine']['pourcentagebenefices']*100 + "% des bénéfices s'applique."; 
	sallesData['cuisine']['tarification'] = 'plancher';
    } else {
	document.getElementById('msgcuisine').innerHTML = "Vous pouvez utiliser la cuisine pour vos repas persos, le café, etc. Dans ce cas, le prix libre s'applique (tarif indicatif de " + sallesData['cuisine']['prixlibredemijournee'] + "€ la demi-journée)."; 
	sallesData['cuisine']['tarification'] = 'prixlibre';
    }
    update(evt,'evt-info');
}

function updateMsgBar(evt) {
    if(document.getElementById('plancheraccueil').selectedOptions[0].value == "oui") {
	document.getElementById('msgbar').innerHTML = "Pour une ouverture du bar, un tarif plancher de " + sallesData['accueil']['prixplancher'] + "€ ou " + sallesData['accueil']['pourcentagebenefices']*100 + "% des bénéfices s'applique."; 
	sallesData['accueil']['tarification'] = 'plancher';
    } else {
	document.getElementById('msgbar').innerHTML = "Dans ce cas, le prix libre s'applique (tarif indicatif de " + sallesData['accueil']['prixlibredemijournee'] + "€ la demi-journée)."; 
	sallesData['accueil']['tarification'] = 'prixlibre';
    }
    update(evt,'evt-info');
}
/* End of specific input functions */

/* Interactive map functions */
function toggleSalle(evt, salle_id) {
    console.log('toggleSalle ' + salle_id);
    let id = salle_id.substr(6,);
    let options = document.getElementById('salles').options;
    let option = null;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value == salle_id) {
	  option = options[i];
	  break;
      }
    }
//    console.log(option);
    if (option != null) {
	let found = false;
	let selected = document.getElementById('salles').selectedOptions;
	for (let i = 0; i < selected.length; i++) {
//	    console.log(selected[i].value + '?');
//	    console.log(selected[i].value == option.value);
	  if (selected[i].value == option.value) {
	      found = true;
	      break;
	  }
	}
	option.selected=!found;
	sallesData[id]['selected'] = option.selected;
	if (['cuisine','accueil'].indexOf(id) > -1) {
	    if (!found) {
		console.log('requiring ' + id);
		document.getElementById('plancher'+id).classList.add('reqfield');
		document.getElementById('utilisation'+id).style.display = 'block';
	    } else {
		document.getElementById('plancher'+id).classList.remove('reqfield');
		document.getElementById('utilisation'+id).style.display = 'none';
	    }
	}
    }
    update(evt, 'evt-room');
}

function setMapForDate(data) {
    atLeastOneEvent = false;
    booked = document.getElementsByClassName('reserved');
    for(let i=booked.length-1;i>=0;i--) {
	booked[i].classList.add('choose');
	hideLegend(booked[i].id, 'hover');
	hideLegend(booked[i].id, 'select');
	booked[i].classList.remove('reserved');
    }
    for (datum of data) {
	for (room of datum.data) {
	    if ('LOCSallesNom' in room) {
		var content = "";
		document.getElementById('salle_'+room.LOCSallesId).classList.add('reserved');
		if(document.getElementById('salle_'+room.LOCSallesId+"_event").innerHTML == "" ){
		    content = "<h3 class='entete'>"+room.LOCSallesNom.display_value+"</h3>";
		}
		content += "<h4>Organisateurice</h4><ul>";//</ul>Contact de la personne en charge de l'évènement</h4><ul>";
		if ('RESPStructure' in room && room.RESPStructure) {
		    content += "<li>Structure : "+room.RESPStructure+"</li>";
		}
		content += "<li>Nom : "+room.RESPNom+"</li><li>Afficher mail ?</li>";//<li>Email : "+room.RESPMail+"</li><li>Numéro de téléphone : "+room.RESPTel+"</li>";
		content += "</ul><h4>Informations sur l'évènement</h4><ul><li>Heure de mise à disposition de la salle : <br>"+new Date(Date.parse(room.HMiseADispo)).toLocaleString()+"</li><li>Heure de restitution : <br>"+new Date(Date.parse(room.HRestitution)).toLocaleString()+"</li></ul>";
		
		if (room.LOCFlexible) {
		    content += "L'organisateurice a indiqué que la localisation de l'évènement était flexible, n'hésitez pas à prendre contact avec elle/lui si besoin.";
		}
		if(document.getElementById('salle_'+room.LOCSallesId+"_event").innerHTML != "" ){
		    document.getElementById('salle_'+room.LOCSallesId+"_event").innerHTML += "<hr>";
		    document.getElementById('salle_'+room.LOCSallesId+"_event").innerHTML += content;
		}
		else {
		    document.getElementById('salle_'+room.LOCSallesId+"_event").innerHTML = content;
		    toggleLegend('salle_'+room.LOCSallesId, 'book');
		}
		atLeastOneEvent = true;
	    }
	}
    }
    document.getElementById('eventinfocontainer').style.display = atLeastOneEvent ? 'block':'none';
    document.getElementById('salle_survol_event').style.display = atLeastOneEvent ? 'block':'none';
}

function toggleLegend(id,type) {
    let legends = document.getElementsByClassName(id + ' legend ' + type);
    for (let i=0;i<legends.length;i++) {
	legends[i].classList.toggle('visible');
    }
}

function toggleInfo(id,type) {
    let infodisplayed = false;
    var infoelems = document.getElementsByClassName(id + ' info ' + type);
    for (let i=0;i<infoelems.length;i++) {
	if (!infoelems[i].classList.contains('event')) {
	    infoelems[i].classList.toggle('displayed');
	    if (infoelems[i].classList.contains('displayed')) {
		infodisplayed = true;
		document.getElementById('salle_survol_info').innerHTML = infoelems[i].innerHTML;
	    }
	}
    }
    if (!infodisplayed) { document.getElementById('salle_survol_info').innerHTML = document.getElementById('infosERP').innerHTML; }
    let eventdisplayed = false;
    var eventelems = document.getElementsByClassName(id + ' event ' + type);
    for (let i=0;i<eventelems.length;i++) {
	eventelems[i].classList.toggle('displayed');
	if (eventelems[i].classList.contains('displayed')) {
	    eventdisplayed = true;
	    document.getElementById('salle_survol_event').innerHTML = eventelems[i].innerHTML;
	}
    }
    if (!eventdisplayed) { document.getElementById('salle_survol_event').innerHTML = ""; }
}

function hideLegend(id,type) {
    let elems = document.getElementsByClassName(id + ' legend ' + type);
    for (let i=0;i<elems.length;i++) {
	elems[i].classList.remove('visible');
    }
}

function mouseOverOutListener(e) {
    if(!e.target.parentNode.classList.contains('selected') && !e.target.parentNode.classList.contains('reserved')) { 
	toggleLegend(e.target.parentNode.id, 'hover');
    }
    //if (!e.target.parentNode.classList.contains('selected')) {
	toggleInfo(e.target.parentNode.id, 'hover');
    //}
}

function clicked(e) {
//if(action=='create'){
    if(e.target.parentNode.classList.contains('reserved') && !e.target.parentNode.classList.contains('locked')) { 
	e.target.parentNode.classList.toggle('reserved'); 
    } else { 
	if (document.getElementById(e.target.parentNode.id+'_event').innerHTML!="") { 
	e.target.parentNode.classList.toggle('reserved'); 
	}
    } 
    e.target.parentNode.classList.toggle('selected');
//}
    toggleSalle(e,e.target.parentNode.id);
    toggleLegend(e.target.parentNode.id, 'hover'); 
    toggleLegend(e.target.parentNode.id, 'select');
    if (document.getElementById(e.target.parentNode.id+'_info').innerHTML!="") {
	if (document.getElementById(e.target.parentNode.id+'_infobtn').style.display=='none') {
	    document.getElementById(e.target.parentNode.id+'_infobtn').style.display='inline';
	    openRoomTab(e,e.target.parentNode.id+'_info','info');
	    openRoomTab(e,e.target.parentNode.id+'_event','event');
	    document.getElementById('salle_survol_info').innerHTML = "";
	    document.getElementById('salle_survol_event').innerHTML = "";
	} else {
	    document.getElementById(e.target.parentNode.id+'_infobtn').style.display='none';
	    document.getElementById(e.target.parentNode.id+'_info').style.display='none';
	    if (document.getElementById(e.target.parentNode.id+'_infobtn').classList.contains("w3-grey"))	 {
		document.getElementById('salle_survol_info').innerHTML = document.getElementById(e.target.parentNode.id+'_info').innerHTML;
		openRoomTab(e,'salle_survol_info','info');
		openRoomTab(e,'salle_survol_event','event');
	    }
	}
    }
    if (document.getElementById(e.target.parentNode.id+'_event').innerHTML!="") {
	if (document.getElementById(e.target.parentNode.id+'_eventbtn').style.display=='none') {
	    document.getElementById(e.target.parentNode.id+'_eventbtn').style.display='inline';
	    openRoomTab(e,e.target.parentNode.id+'_info','info');
	    openRoomTab(e,e.target.parentNode.id+'_event','event');
	    document.getElementById('salle_survol_info').innerHTML = "";
	    document.getElementById('salle_survol_event').innerHTML = "";
	} else {
	    document.getElementById(e.target.parentNode.id+'_eventbtn').style.display='none';
	    document.getElementById(e.target.parentNode.id+'_event').style.display='none';
	}
    }
}
/* End of interactive map functions */

/* Signature functions */
function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();
    document.getElementById('signchecker').checked=true;
}

function reset() {
    erase();
    addLegend();
}

function erase() {
    ctx.clearRect(0, 0, w, h);
    document.getElementById('signchecker').checked=false;
    update(null,'sign');
}

function addLegend() {
    ctx.fillText("Signez dans ce cadre",w/2-90,h/2);
    ctx.fillText("ou importez une image",w/2-94,h/2+25);
    legend = true;
}

function drawSign() {
    let img = document.getElementById('signimg');
    erase();
    ctx.drawImage(img, (w-img.width)/2, (h-img.height)/2, img.width, img.height);
    document.getElementById('signchecker').checked=true;
    console.log('signchecker ' + document.getElementById('signchecker').checked.toString());
    update(null,'sign');
}

function importImg() {
    let reader = new FileReader();
    reader.readAsDataURL(document.getElementById('signstorage').files[0]);
    reader.onloadend = function () {
	console.log('entered');
	legend = false;
	let img = document.getElementById('signimg');
	if(img.width>w) {
	    img.height = img.height * w/img.width;
	    img.width = w;
	}
	if(img.height>h) {
	    img.width = img.width * h/img.height;
	    img.height = h;
	}
	img.src = reader.result;
    }
}

function findxy(res, e, source) {
    if(source){
	var clientX = e.changedTouches[0].clientX;
	var clientY = e.changedTouches[0].clientY;
    }else{
	var clientX = e.clientX;
	var clientY = e.clientY;
    }

    if (res == 'down') {
	if(legend) {
	    erase();
	    legend = false;
	    //document.getElementById('signchecker').checked=true;
	    console.log('signchecker ' + document.getElementById('signchecker').checked.toString());
	}
	prevX = currX;
	prevY = currY;
	currX = clientX - canvas.getBoundingClientRect().left;
	currY = clientY - canvas.getBoundingClientRect().top;

	flag = true;
	dot_flag = true;
	if (dot_flag) {
	    ctx.beginPath();
	    ctx.fillStyle = "black";
	    ctx.fillRect(currX, currY, 2, 2);
	    ctx.closePath();
	    dot_flag = false;
	}
    }

    if (res == 'up' || res == "out") {
	flag = false;
	update(null,'sign');
    }

    if (res == 'move') {
	if (flag) {
	    prevX = currX;
	    prevY = currY;
	    currX = clientX - canvas.getBoundingClientRect().left;
	    currY = clientY - canvas.getBoundingClientRect().top;
	    draw();
	}
    }
}
/* End of signature functions */

function getDateInfo(evt) {
    update(evt,'evt-room');
    /*let selected = document.getElementsByClassName('selected');
    for(let i=selected.length-1;i>=0;i--) {
	selected[i].classList.remove('selected');
    }
    let legends = document.getElementsByClassName('legend visible');
	for (let i=legends.length-1;i>=0;i--) {
	legends[i].classList.remove('visible');
	}*/
    let eventinfos = document.getElementsByClassName('event');
	for (let i=eventinfos.length-1;i>=0;i--) {
	    eventinfos[i].innerHTML="";
	}
    /*let infos = document.getElementsByClassName('info');
	for (let i=infos.length-1;i>=0;i--) {
	    infos[i].classList.remove('displayed');
	}*/
    let data = new FormData();
    data.append('action','getdateinfos');
    data.append('date',document.getElementById('date').value);
    fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/dff9c55e-6d4b-4710-93eb-041f383b01c8", {
      method: "POST",
      body: data
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      setMapForDate(data);
    });
}

function getDatetimeStr(d) {
    let datestr = getDateStr(d);
    datestr += 'T';
    if (d.getHours()<10) {
     datestr += '0';
    }
    datestr += d.getHours().toString() + ':';
    if (d.getMinutes()<10) {
     datestr += '0';
    }
    datestr += d.getMinutes().toString();
    return datestr;
}

function getDateStr(d) {
    let datestr = d.getFullYear().toString() + '-';
    if (d.getMonth()+1<10) {
     datestr += '0';
    }
    datestr += (d.getMonth()+1).toString() + '-';
    if (d.getDate()<10) {
     datestr += '0';
    }
    datestr += d.getDate().toString();
    return datestr;
}

function getHourStr(date) {
    const hourStr = date.getHours()<10?'0'+date.getHours().toString():date.getHours().toString();
    let minStr = ':';
    minStr += date.getMinutes()<10?'0'+date.getMinutes().toString():date.getMinutes().toString();
    return hourStr+minStr;
}

/*function getISOString(currentDate) {
    currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());
    let ISOString = currentDate.getFullYear().toString() + '-' + (currentDate.getMonth()+1).toString() + '-' + currentDate.getDate().toString();
    ISOString += 'T' + getHourStr(currentDate);
    return ISOString;
}*/

var modal = jSuites.modal(document.getElementById('salles_modal'), {
    maxWidth: '500px',
    maxHeight: '180px',
    closed: true,
});

var deleteModal = jSuites.modal(document.getElementById('delete_modal'), {
    maxWidth: '500px',
    maxHeight: '180px',
    closed: true,
});

function checkData(data,tag,elemtag,mode='default') {
    let check = tag in data && data[tag] != null;
    if (check) {
	//console.log('tag ' + elemtag);
	if (mode=='default') {
	    document.getElementById(elemtag).value = data[tag];
	} else  if (mode == 'editor') {
	    elemtag.innerHTML = converter.makeHtml(data[tag]);
	} else if (mode == 'hour') {
	    let dateDate = new Date(data[tag]);
	    document.getElementById(elemtag).value = getHourStr(dateDate);
	} else if (mode == 'datetime') {
	    let dateDate = new Date(data[tag]);
	    document.getElementById(elemtag).value = getDatetimeStr(dateDate);
	} else if (mode == 'date') {
	    let dateDate = new Date(data[tag]);
	    document.getElementById(elemtag).value = getDateStr(dateDate);
	    getDateInfo(null);
	}
    }
    return check;
}

function fillData(data) {
    for (let salle of data.LOCSallesId) {
	document.getElementById('salle_'+salle).classList.add('reserved', 'locked');
	toggleLegend('salle_'+salle, 'book');
	for (let elem of document.getElementsByClassName('salle_'+salle,'legend')) {
	    elem.classList.add('visible');
	}
    }
    //console.log(data);
    checkData(data,'RESPNom', 'nom');
    checkData(data,'RESPMail', 'email');
    checkData(data,'RESPStructure', 'structure');
    checkData(data,'RESPTel', 'phone');
    checkData(data,'HMiseADispo', 'date', 'date');
    checkData(data,'HMiseADispo', 'hdispo', 'datetime');
    checkData(data,'HRestitution', 'hrestit', 'datetime');
    checkData(data,'LOCFlexible', 'locflexible');
    if (checkData(data,'REGOuiNon', 'regevt')) {
	checkData(data,'REGType', 'regtype');
	checkData(data,'REGFrequence', 'regfreq');
    }
    checkData(data,'EVTNom', 'nomevt');
    checkData(data,'EVTDescription', document.getElementsByClassName('ql-editor')[0], 'editor');
    checkData(data,'HDebut', 'hdebut', 'datetime');
    checkData(data,'HFin', 'hfin', 'datetime');
    checkData(data,'PAF', 'montantpaf');
    openPage(null,'org');
    document.getElementById('navbtn_org_prev').style.display = 'none';
    document.getElementById('btn_intro').style.display = 'none';
    document.getElementById('btn_newcomer').style.display = 'none';
    document.getElementById('btn_recap').style.display = 'none';
    document.getElementById('navbtn_com_next').onclick = submit;
    document.getElementById('navbtn_com_next').innerHTML = 'Envoyer';
    document.getElementById('choix_salles').innerHTML = '<span class="entete">ATTENTION</span> À cette étape, votre/vos salle(s) <b>ne sont plus modifiables !</b> <input type="button" value="+" onclick="modal.open()">';
    document.getElementById('evtdelete').style.display = 'block';
}

function deleteEvent() {
    deleteModal.close();
}

function sign() {
    jSuites.loading.show();
    let data = new FormData();
    data.append('action','sign');
    data.append('_id', eventID);
    canvas.toBlob((blob) => {
        data.append('signature',blob,'signature.png');
	console.log(data);
	document.getElementById('signresult').innerHTML = 'Traitement en cours, veuillez patienter.'
	fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/dff9c55e-6d4b-4710-93eb-041f383b01c8", {
	  method: "POST",
	  body: data
	}).then(res => {
	      console.log("Request complete! response:", res);
	      if (res.status == 200) {
		  jSuites.loading.hide();
		  document.getElementById('signresult').innerHTML = "✅ Merci ! Votre convention a bien été signée et votre demande d'évènement transmise à la Perm.";
	      }
	});
    });
}

function submit(evt) {
    jSuites.loading.show();
    let data = new FormData();
    data.append('action',action);
    if (action=="update") { data.append('_id', eventID) };
    let inputs = document.querySelectorAll("input, select");
    let dataNotToAdd = [];
    if (!document.getElementById('regevt').checked) {
	dataNotToAdd=['regevt','regtype','regfreq'];
    }
    for (let input of inputs) {
	if (input.tagName.toLowerCase()=="input") {
	    if (dataNotToAdd.length==0 || dataNotToAdd.length>0 && input.id.indexOf(dataNotToAdd)==-1) {
		switch(input.type) {
		  case "checkbox":
		    data.append(input.id,input.checked);
		    break;
		  case "datetime-local":
		    let inputDate = input.valueAsDate;
		    inputDate.setMinutes(inputDate.getMinutes() + inputDate.getTimezoneOffset());
		    data.append(input.id,inputDate);
		    break;
		  default:
		    data.append(input.id,input.value);
		} 
	    }
	}
	else if (input.tagName.toLowerCase()=="select") {
	    for (let opt of input.selectedOptions) {
		data.append(input.id,opt.value);
	    }
	}
    }
    if (document.getElementById('rmq').value != "") { data.append('rmq',document.getElementById('rmq').value); }
    for (let f=0;f<filesList.length;f++) {
	data.append("fileToUpload", filesList[f], filesList[f].name);
    }
    //console.log(data);
    document.getElementById('navbtn_com_next').disabled = true;
    document.getElementById('result').innerHTML = 'Envoi du message en cours, veuillez patienter.'
    fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/dff9c55e-6d4b-4710-93eb-041f383b01c8", {
      method: "POST",
      body: data
    }).then(function(response) {
	  return response.json();
	}).then(function(data) {
//	      console.log("Request complete! response:", data);
	      if (data.success == true) {
		  let formData = new FormData();
		  //jSuites.loading.hide();
		  formData.append('_id', data._id);
		  formData.append('action','getlinkconvention');
		  fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/dff9c55e-6d4b-4710-93eb-041f383b01c8", {
		    method: "POST",
		    body: formData
		  }).then(function(response) {
		    return response.json();
		  }).then(function(data) {
		    //console.log(data);
		    document.getElementById('linkconvention').href = data.publicURL;
		    openPage(evt,'sign');
		    document.getElementById('content').style.display = 'block';
		    jSuites.loading.hide();
		});
	      }
	      else {
		  document.getElementById('result').innerHTML = "🛑 Désolé, nous avons rencontré une erreur lors de l'enregistrement de votre demande.<br>Merci de contacter le groupe programmation via <a href='https://laperm.org/contacts.php' target='_self'>le formulaire de contact</a>";
		  jSuites.loading.hide();
	      }
    });
    /*}).then(function(response) {
      return response.json();
    }).then(function(response) {
	
    }*/
}

function init(evt) {
    jSuites.loading.show();
    document.getElementById('files').files = new DataTransfer().files;
    canvas = document.getElementById('can');
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;
    ctx.font = "20px Arial";
    addLegend();

    canvas.addEventListener("mousemove", function (e) {
	findxy('move', e, '')
    }, false);
    canvas.addEventListener("mousedown", function (e) {
	findxy('down', e, '')
    }, false);
    canvas.addEventListener("mouseup", function (e) {
	findxy('up', e, '')
    }, false);
    canvas.addEventListener("mouseout", function (e) {
	findxy('out', e, '')
    }, false);

    canvas.addEventListener("touchmove", function (e) {
	findxy('move', e, 'touch')
    }, false);
    canvas.addEventListener("touchstart", function (e) {
	findxy('down', e, 'touch')
    }, false);
    canvas.addEventListener("touchend", function (e) {
	findxy('up', e, 'touch')
    }, false); 
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    //else {
    salles = document.getElementsByClassName('choose');
    for(let i=0;i<salles.length;i++) {
	salles[i].addEventListener("click",function(e) {clicked(e)},false);
	salles[i].addEventListener("mouseover",function(e) {mouseOverOutListener(e)},false);
	salles[i].addEventListener("mouseout",function(e) {mouseOverOutListener(e)},false);
    }
    booked = document.getElementsByClassName('reserved');
    for(let i=0;i<booked.length;i++) {
	toggleLegend(booked[i].id, 'book');
    }
    update(null,'intro');
    let data = new FormData();
    if (urlParams.has('sign')) {
	document.getElementById('btn_sign').style.display = 'block';
	document.getElementById('btn_intro').style.display = 'none';
	document.getElementById('btn_newcomer').style.display = 'none';
	document.getElementById('btn_org').style.display = 'none';
	document.getElementById('btn_evt-room').style.display = 'none';
	document.getElementById('btn_evt-info').style.display = 'none';
	document.getElementById('btn_com').style.display = 'none';
	document.getElementById('btn_recap').style.display = 'none';
	eventID = urlParams.get('id');
	data.append('_id', eventID);
	data.append('action','getlinkconvention');
	fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/dff9c55e-6d4b-4710-93eb-041f383b01c8", {
	  method: "POST",
	  body: data
	}).then(function(response) {
	  return response.json();
	}).then(function(data) {
	    console.log(data);
	    document.getElementById('linkconvention').href = data.publicURL;
	     openPage(evt,'sign');
	      document.getElementById('content').style.display = 'block';
	      jSuites.loading.hide();
	});
	 
    } else {
    data.append('action','getsallesinfos');
    fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/dff9c55e-6d4b-4710-93eb-041f383b01c8", {
      method: "POST",
      body: data
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      for (let dat of data) {
      //console.log(dat);
	  sallesData[dat.id] = {'tarification': 'prixlibre'};
	  document.getElementById('salle_' + dat.id + '_infobtn').innerHTML = dat.Nom;
	  document.getElementById('salle_' + dat.id + '_eventbtn').innerHTML = dat.Nom;
	  document.getElementById('salle_' + dat.id + '_infobtn').addEventListener("click",function(e) {openRoomTab(e,'salle_' + dat.id + '_info','info')},false);
	  document.getElementById('salle_' + dat.id + '_eventbtn').addEventListener("click",function(e) {openRoomTab(e,'salle_' + dat.id + '_event','event')},false);
	  if ('Description' in dat || 'Jauge' in dat || 'Photos' in dat || 'PrixLibreIndicatifDemiJournee' in dat || 'PrixPlancher' in dat || 'PourcentageBenefices' in dat) {
	      document.getElementById('salle_' + dat.id + '_info').innerHTML = '<h3 class="entete">' + dat.Nom + '</h3>';
	      if(dat.Description != null) { document.getElementById('salle_' + dat.id + '_info').innerHTML += '<p>' + converter.makeHtml(dat.Description) + '</p><br>'; }
	      if ('Jauge' in dat && dat.Jauge != null) { document.getElementById('salle_' + dat.id + '_info').innerHTML += '<p>Jauge : ' + dat.Jauge + '.</p><br>'; }
	      if ('PrixLibreIndicatifDemiJournee' in dat && dat.PrixLibreIndicatifDemiJournee != null) { document.getElementById('salle_' + dat.id + '_info').innerHTML += '<p>Prix libre avec tarif indicatif : ' + dat.PrixLibreIndicatifDemiJournee + '€ la demi-journée.</p>'; sallesData[dat.id]['prixlibredemijournee'] = dat.PrixLibreIndicatifDemiJournee; }
	      let plancher = "";
	      if ('PrixPlancher' in dat && dat.PrixPlancher != null && 'ConditionsPrixPlancher' in dat && dat.ConditionsPrixPlancher != null) { plancher += '<p>' + dat.ConditionsPrixPlancher + ' : ' + dat.PrixPlancher + '€ '; sallesData[dat.id]['prixplancher'] = dat.PrixPlancher; } //document.getElementById('salle_' + dat.id + '_info').innerHTML
	      if ('PourcentageBenefices' in dat && dat.PourcentageBenefices != null) { plancher += ' ou ' + dat.PourcentageBenefices*100 + '% des bénéfices.'; sallesData[dat.id]['pourcentagebenefices'] = dat.PourcentageBenefices; }
	      if ('PrixPlancher' in dat && dat.PrixPlancher != null && 'ConditionsPrixPlancher' in dat && dat.ConditionsPrixPlancher != null) { document.getElementById('salle_' + dat.id + '_info').innerHTML += plancher + '</p><br>'; }
	      if ('Photos' in dat && dat.Photos != null){
		  document.getElementById('salle_' + dat.id + '_info').innerHTML += '<p>';
		  for (let photo of dat.Photos) {
		      document.getElementById('salle_' + dat.id + '_info').innerHTML += '<img alt="'+photo.name+'" src="'+photo.public_url+'" width="'+Math.round(document.documentElement.scrollWidth*0.2)+'px">';
		      if(dat.Photos.indexOf(photo)<dat.Photos.length-1){
			  document.getElementById('salle_' + dat.id + '_info').innerHTML += '<br><br>';
		      }
		  }
		  document.getElementById('salle_' + dat.id + '_info').innerHTML += '</p><br>';
	      }
	  }
	  var opt = document.createElement('option');
	  opt.value = 'salle_'+dat.id;
	  opt.innerHTML = dat.Nom;
	  document.getElementById('salles').appendChild(opt);
      }
      document.getElementById('salle_survol_info').innerHTML = document.getElementById('infosERP').innerHTML;
      document.getElementById('salles').selectedIndex = -1;
      document.getElementById('salle_survol_infobtn').addEventListener("click",function(e) {openRoomTab(e,'salle_survol_info','info')},false);
      document.getElementById('salle_survol_eventbtn').addEventListener("click",function(e) {openRoomTab(e,'salle_survol_event','event')},false);
      //openPage(evt,'sign'); //////////////////////////////////////////////////////////////////////////////
      console.log(urlParams);
      if (urlParams.has('id')) {
	action = 'update';
	let lockedInputs = document.querySelectorAll("input:not(.com), select:not(.com)");
	for (let lockedInput of lockedInputs) {
	    if (lockedInput.id != 'files' && lockedInput.id != 'filesbutton' && lockedInput.id != 'date') {
		lockedInput.disabled = true;
	    }
	}
	eventID = urlParams.get('id');
	let data = new FormData();
	data.append('action','getevent');
	data.append('_id', eventID);
	fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/dff9c55e-6d4b-4710-93eb-041f383b01c8", {
	  method: "POST",
	  body: data
	}).then(function(response) {
	  return response.json();
	}).then(function(data) {
	    if (data.length == 1) {
		if (Object.keys(data[0]).length>0) {
		    fillData(data[0]);
		    if ('EVTVisuel' in data[0] && data[0].EVTVisuel != null) {
			let list = new DataTransfer();
			for (let fileidx=0; fileidx<data[0].EVTVisuel.length; fileidx++) {
			    let file =  data[0].EVTVisuel[fileidx];
			    fetch(file.public_url)
			      .then(res => { return res.blob(); }) // Gets the response and returns it as a blob
			      .then(blob => {
				let filedata = new File([blob], file.name, {'type': blob.type, 'size': blob.size});
				list.items.add(filedata);
				document.getElementById('files').files = list.files;
				if (list.items.length == data[0].EVTVisuel.length) {
				    uploadFileList(null);
				}
			    });
			    
			}
		    }
		}
		else {
		    document.getElementById('result').innerHTML = "🛑 Désolé, nous n'avons pas réussi à retrouver les données concernant votre évènement. Êtes-vous sûr·e de ne pas l'avoir annulé?<br>Dans le cas contraire, merci de contacter le groupe programmation via <a href='https://laperm.org/contacts.php' target='_self'>le formulaire de contact</a>";
		    openPage(evt,'recap');
		    document.getElementById('blabla').style.display='none';
		    document.getElementById('navbtn_recap_prev').style.display='none';
		    document.getElementById('navbtn_recap_next').style.display='none';
		    
		}
	    }
	    openPage(evt,'com');
	    document.getElementById('content').style.display = 'block';
	    jSuites.loading.hide();
	});
      } else {
	  document.getElementById('content').style.display = 'block';
	  jSuites.loading.hide();
      }
    });
   }
}

