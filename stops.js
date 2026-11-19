export const stops = [
  {
    id:'pavone', number:'00', name:'Teatro Pavone', place:'Piazza della Repubblica', lat:43.1102476, lon:12.3880897, left:true,
    type:'entry',
    description:[
      'Il punto di partenza proposto. Apri la mappa e scegli uno dei cinque incontri nel centro storico.',
      'The proposed starting point. Open the map and choose one of the five encounters in the historic centre.',
    ],
  },
  {
    id:'dark-money', number:'01', name:'Dark Money', place:'Hotel Brufani · Piazza Italia', lat:43.10850, lon:12.38757, left:true,
    team:'Floodlight · Polyvale Studios · OCCRP reporting',
    description:[
      'Un gioco ispirato alle inchieste Laundromat di OCCRP. La tappa anticipa il gioco con un primo passo per seguire il denaro.',
      'A game inspired by OCCRP’s Laundromat reporting. This stop previews the game with a first step in following the money.',
    ],
    task:['Segui la transazione','Follow the transaction'],
    prompt:['Due società appaiono sulla stessa traccia bancaria. Quale documento apriresti per primo?', 'Two companies appear on the same bank trail. Which document would you open first?'],
    options:[
      [['Registro delle società','Company register'],['Cerca chi controlla le società e confronta nomi e date.','Find who controls the companies and cross-check names and dates.']],
      [['Cronologia dei pagamenti','Payment timeline'],['Confronta le date dei pagamenti e cerca passaggi ricorrenti.','Compare payment dates and look for recurring transfers.']],
    ],
  },
  {
    id:'kleptocrat', number:'02', name:'Kleptocrat', place:'Via Giuseppe Mazzini 10', lat:43.1109473, lon:12.3888569, left:true,
    team:'Seek Initiative',
    description:[
      'Ispeziona un elemento dell’incontro per aprire un primo indizio investigativo.',
      'Inspect an object from the encounter to uncover a first investigative clue.',
    ],
    task:['Ispeziona il documento','Inspect the document'],
    prompt:['Un contratto di esempio indica un numero di gara. Dove cercheresti un riscontro?', 'A sample contract includes a tender number. Where would you look for independent confirmation?'],
    options:[
      [['Bando e allegati','Tender and attachments'],['Verifica che oggetto, importi e scadenze coincidano.','Check that the subject, amounts and deadlines match.']],
      [['Esito della gara','Award notice'],['Cerca chi ha ottenuto l’appalto e chi ha firmato l’aggiudicazione.','Look for the winning bidder and the person who signed the award.']],
    ],
  },
  {
    id:'ciudad-perdida', number:'03', name:'Ciudad Perdida', place:'Rocca Paolina', lat:43.10815, lon:12.38854,
    team:'Alharaca StoryLab',
    description:[
      'La scheda anticipa un incontro con materiali d’archivio e testimonianze. Qui puoi provare la scelta di un frammento.',
      'The stop previews an encounter with archive material and testimony. Here you can try choosing a fragment.',
    ],
    task:['Apri un frammento d’archivio','Open an archive fragment'],
    prompt:['Da quale tipo di fonte inizieresti per ricostruire un luogo scomparso?', 'Which source would you start with to reconstruct a place that has disappeared?'],
    options:[
      [['Mappa storica','Historical map'],['Annota la data, l’autore e i toponimi da confrontare con le altre fonti.','Note the date, author and place names to compare against other sources.']],
      [['Testimonianza','Testimony'],['Distingui i ricordi diretti dai racconti riferiti e conserva il contesto della testimonianza.','Separate direct recollections from second-hand accounts and retain the context.']],
    ],
  },
  {
    id:'simulations-lab', number:'04', name:'Investigative Simulations Lab', place:'Piazza IV Novembre', lat:43.112192, lon:12.38881,
    team:'Investigative Simulations Lab',
    description:[
      'Apri un dossier dimostrativo e scegli una pista da verificare. La tappa introduce la simulazione dal vivo proposta per il festival.',
      'Open a sample dossier and choose a lead to verify. This stop introduces the proposed live festival simulation.',
    ],
    task:['Apri il dossier','Open the dossier'],
    prompt:['Due versioni dello stesso evento riportano orari diversi. Qual è il tuo prossimo passo?', 'Two accounts of the same event give different times. What is your next step?'],
    options:[
      [['Ricostruisci la cronologia','Rebuild the timeline'],['Segna fonte, ora e grado di certezza per ogni voce.','Record source, time and certainty for each entry.']],
      [['Cerca una fonte indipendente','Find an independent source'],['Cerca una traccia contemporanea all’evento per verificare entrambe le versioni.','Look for a record from the time of the event to check both accounts.']],
    ],
  },
  {
    id:'bots-ridge', number:'05', name:'The Bots Ridge', place:'Piazza Giacomo Matteotti', lat:43.11108, lon:12.38956,
    team:'CCIJ', pilot:true,
    description:[
      'Recupera un Data Fragment e valuta una traccia prima di usarla in un’inchiesta. Questa è la tappa con il pilota AR già integrato.',
      'Recover a Data Fragment and assess a lead before using it in an investigation. This stop includes the existing AR pilot.',
    ],
    task:['Recupera il Data Fragment','Recover the Data Fragment'],
    prompt:['Lo stesso messaggio compare su più account. Che cosa controlleresti per capire come si è diffuso?', 'The same message appears across several accounts. What would you check to understand how it spread?'],
    options:[
      [['Orari dei post','Post timestamps'],['Confronta l’ordine dei post e gli intervalli tra le pubblicazioni.','Compare the order of posts and intervals between them.']],
      [['Origine del contenuto','Origin of the content'],['Cerca il primo post verificabile e segui rimandi e ripubblicazioni.','Find the earliest verifiable post and trace links and reposts.']],
    ],
  },
];
