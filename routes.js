export const ROUTES = [
  {
    id: "jilo-sub",
    name: "Av. Jilotepec - Suburbano Cuautitlán",
    color: "#e74c3c",
    waypoints: [
      { lat: 19.7665, lng: -99.2188 },     // Av. Jilotepec, Santa Cruz del Monte
      { lat: 19.767755, lng: -99.224037 }, // Lumbreras
      { lat: 19.774984, lng: -99.226900 }, // Independiente
      { lat: 19.775306, lng: -99.208210 }, // Coyotepec Centro
      { lat: 19.758764, lng: -99.195151 }, // Zimapán
      { lat: 19.743476, lng: -99.178287 }, // Teoloyucan
      { lat: 19.705574, lng: -99.192166 }, // San Lorenzo, Cuautitlán
      { lat: 19.687295, lng: -99.186265 }, // FES Cuautitlán
      { lat: 19.667474, lng: -99.176504 }  // Suburbano de Cuautitlán
    ],
    origin: { lat: 19.7665, lng: -99.2188 },
    destination: { lat: 19.667474, lng: -99.176504 }
  },
  {
    id: "jilo-hueh-centro",
    name: "Av. Jilotepec - Huehuetoca Centro",
    color: "#27ae60",
    waypoints: [
      { lat: 19.7665, lng: -99.2188 }, { lat: 19.767755, lng: -99.224037 }, { lat: 19.774984, lng: -99.226900 },
      { lat: 19.775306, lng: -99.208210 }, { lat: 19.771419, lng: -99.201551 }, { lat: 19.787314, lng: -99.200670 },
      { lat: 19.787512, lng: -99.201423 }, { lat: 19.816954, lng: -99.205118 }, { lat: 19.820744, lng: -99.203820 },
      { lat: 19.835352, lng: -99.204859 }
    ],
    origin: { lat: 19.7665, lng: -99.2188 },
    destination: { lat: 19.835352, lng: -99.204859 }
  },
  {
    id: "jilo-hueh-dorado",
    name: "Av. Jilotepec - Huehuetoca, Dorado",
    color: "#2980b9",
    waypoints: [
      { lat: 19.7665, lng: -99.2188 }, { lat: 19.767755, lng: -99.224037 }, { lat: 19.774984, lng: -99.226900 },
      { lat: 19.775306, lng: -99.208210 }, { lat: 19.771419, lng: -99.201551 }, { lat: 19.787314, lng: -99.200670 },
      { lat: 19.787512, lng: -99.201423 }, { lat: 19.816954, lng: -99.205118 }, { lat: 19.820744, lng: -99.203820 },
      { lat: 19.835352, lng: -99.204859 }, { lat: 19.878739, lng: -99.215144 }, { lat: 19.887889, lng: -99.211151 },
      { lat: 19.887294, lng: -99.205465 }
    ],
    origin: { lat: 19.7665, lng: -99.2188 },
    destination: { lat: 19.887294, lng: -99.205465 }
  },
  {
    id: "dorado-sub",
    name: "Dorado Huehuetoca - Suburbano Cuautitlán",
    color: "#8e44ad",
    waypoints: [
      { lat: 19.887294, lng: -99.205465 }, { lat: 19.887889, lng: -99.211151 }, { lat: 19.878739, lng: -99.215144 },
      { lat: 19.835352, lng: -99.204859 }, { lat: 19.820744, lng: -99.203820 }, { lat: 19.816954, lng: -99.205118 },
      { lat: 19.787512, lng: -99.201423 }, { lat: 19.787314, lng: -99.200670 }, { lat: 19.747617, lng: -99.199976 },
      { lat: 19.715209, lng: -99.195641 }, { lat: 19.708442, lng: -99.193088 }, { lat: 19.705574, lng: -99.192166 },
      { lat: 19.687295, lng: -99.186265 }, { lat: 19.667474, lng: -99.176504 }
    ],
    origin: { lat: 19.887294, lng: -99.205465 },
    destination: { lat: 19.667474, lng: -99.176504 }
  },
  {
    id: "sub-dorado",
    name: "Suburbano Cuautitlán - Dorado Huehuetoca",
    color: "#f39c12",
    waypoints: [
      { lat: 19.667474, lng: -99.176504 }, { lat: 19.687295, lng: -99.186265 }, { lat: 19.705574, lng: -99.192166 },
      { lat: 19.708442, lng: -99.193088 }, { lat: 19.715209, lng: -99.195641 }, { lat: 19.747617, lng: -99.199976 },
      { lat: 19.787314, lng: -99.200670 }, { lat: 19.787512, lng: -99.201423 }, { lat: 19.816954, lng: -99.205118 },
      { lat: 19.820744, lng: -99.203820 }, { lat: 19.835352, lng: -99.204859 }, { lat: 19.878739, lng: -99.215144 },
      { lat: 19.887889, lng: -99.211151 }, { lat: 19.887294, lng: -99.205465 }
    ],
    origin: { lat: 19.667474, lng: -99.176504 },
    destination: { lat: 19.887294, lng: -99.205465 }
  },
  {
    id: "dorado-quebrada",
    name: "Dorado Huehuetoca - La Quebrada",
    color: "#16a085",
    waypoints: [
      { lat: 19.887294, lng: -99.205465 }, { lat: 19.887889, lng: -99.211151 }, { lat: 19.878739, lng: -99.215144 },
      { lat: 19.835352, lng: -99.204859 }, { lat: 19.820744, lng: -99.203820 }, { lat: 19.816954, lng: -99.205118 },
      { lat: 19.787512, lng: -99.201423 }, { lat: 19.787314, lng: -99.200670 }, { lat: 19.747617, lng: -99.199976 },
      { lat: 19.715209, lng: -99.195641 }, { lat: 19.708442, lng: -99.193088 }, { lat: 19.705574, lng: -99.192166 },
      { lat: 19.687295, lng: -99.186265 }, { lat: 19.671682, lng: -99.183736 }, { lat: 19.595379, lng: -99.189766 }
    ],
    origin: { lat: 19.887294, lng: -99.205465 },
    destination: { lat: 19.595379, lng: -99.189766 }
  },
  {
    id: "las-torres-sub",
    name: "Av. Las Torres - Suburbano Cuautitlán",
    color: "#1565C0",
    waypoints: [ { lat:19.770865,lng:-99.237091 }, { lat:19.767755,lng:-99.224037 }, { lat:19.774984,lng:-99.226900 }, { lat:19.775306,lng:-99.208210 }, { lat:19.758764,lng:-99.195151 }, { lat:19.743476,lng:-99.178287 }, { lat:19.705574,lng:-99.192166 }, { lat:19.687295,lng:-99.186265 }, { lat:19.667474,lng:-99.176504 } ],
    origin: { lat:19.770865,lng:-99.237091 },
    destination: { lat:19.667474,lng:-99.176504 }
  },
  {
    id: "las-torres-hueh-centro",
    name: "Av. Las Torres - Huehuetoca Centro",
    color: "#2E7D32",
    waypoints: [ { lat:19.770865,lng:-99.237091 }, { lat:19.767755,lng:-99.224037 }, { lat:19.774984,lng:-99.226900 }, { lat:19.775306,lng:-99.208210 }, { lat:19.771419,lng:-99.201551 }, { lat:19.787314,lng:-99.200670 }, { lat:19.787512,lng:-99.201423 }, { lat:19.816954,lng:-99.205118 }, { lat:19.820744,lng:-99.203820 }, { lat:19.835352,lng:-99.204859 } ],
    origin: { lat:19.770865,lng:-99.237091 },
    destination: { lat:19.835352,lng:-99.204859 }
  },
  {
    id: "las-torres-hueh-dorado",
    name: "Av. Las Torres - Huehuetoca, Dorado",
    color: "#00897B",
    waypoints: [ { lat:19.770865,lng:-99.237091 }, { lat:19.767755,lng:-99.224037 }, { lat:19.774984,lng:-99.226900 }, { lat:19.775306,lng:-99.208210 }, { lat:19.771419,lng:-99.201551 }, { lat:19.787314,lng:-99.200670 }, { lat:19.787512,lng:-99.201423 }, { lat:19.816954,lng:-99.205118 }, { lat:19.820744,lng:-99.203820 }, { lat:19.835352,lng:-99.204859 }, { lat:19.878739,lng:-99.215144 }, { lat:19.887889,lng:-99.211151 }, { lat:19.887294,lng:-99.205465 } ],
    origin: { lat:19.770865,lng:-99.237091 },
    destination: { lat:19.887294,lng:-99.205465 }
  },
  {
    id: "las-torres-quebrada",
    name: "Av. Las Torres - La Quebrada",
    color: "#00695C",
    waypoints: [ { lat:19.770865,lng:-99.237091 }, { lat:19.767755,lng:-99.224037 }, { lat:19.774984,lng:-99.226900 }, { lat:19.775306,lng:-99.208210 }, { lat:19.758764,lng:-99.195151 }, { lat:19.743476,lng:-99.178287 }, { lat:19.705574,lng:-99.192166 }, { lat:19.687295,lng:-99.186265 }, { lat:19.671682,lng:-99.183736 }, { lat:19.595379,lng:-99.189766 } ],
    origin: { lat:19.770865,lng:-99.237091 },
    destination: { lat:19.595379,lng:-99.189766 }
  },
  {
    id: "quebrada-dorado",
    name: "La Quebrada - Dorado Huehuetoca",
    color: "#0D47A1",
    waypoints: [ { lat:19.595379,lng:-99.189766 }, { lat:19.671682,lng:-99.183736 }, { lat:19.687295,lng:-99.186265 }, { lat:19.705574,lng:-99.192166 }, { lat:19.708442,lng:-99.193088 }, { lat:19.715209,lng:-99.195641 }, { lat:19.747617,lng:-99.199976 }, { lat:19.787314,lng:-99.200670 }, { lat:19.787512,lng:-99.201423 }, { lat:19.816954,lng:-99.205118 }, { lat:19.820744,lng:-99.203820 }, { lat:19.835352,lng:-99.204859 }, { lat:19.878739,lng:-99.215144 }, { lat:19.887889,lng:-99.211151 }, { lat:19.887294,lng:-99.205465 } ],
    origin: { lat:19.595379,lng:-99.189766 },
    destination: { lat:19.887294,lng:-99.205465 }
  }
];