const step = (id, text, extra = {}) => ({ id, text, ...extra });
const chapter = (id, title, english, region, summary, pages, steps, tips = [], extra = {}) => ({
  id, title, english, region, summary, pages, steps, tips, ...extra
});

export const guide = {
  id: 'gold-silver',
  title: 'Gold & Silber',
  platform: 'Game Boy Color',
  scope: 'Story- und Sammelguide für die Originalspiele Pokémon Gold und Silber.',
  source: {
    title: 'Nintendo Power · Pokémon Gold & Silver · 2000',
    note: 'Eigenständig formulierte deutsche Schrittfolgen auf Grundlage der bereitgestellten Vorlage. Die Seitenangaben zählen die PDF-Seiten ab 1. Die Sammelreise ergänzt editionsabhängige Fangorte und Item-Funde aus den originalen Spieldaten; Quellen und Vergleichsregel stehen dort. Attackentabellen und begehbare Raumkarten sind nicht enthalten.'
  },
  regions: [
    { id: 'johto', label: 'Johto', subtitle: 'Die ersten acht Orden' },
    { id: 'league', label: 'Pokémon-Liga', subtitle: 'Auf dem Weg zum Champ' },
    { id: 'kanto', label: 'Kanto', subtitle: 'Acht weitere Arenen & das Finale' },
    { id: 'extras', label: 'Abseits des Weges', subtitle: 'Freiwillige Abstecher' }
  ],
  badges: [
    { id: 'zephyr', name: 'Flügelorden', leader: 'Falk', city: 'Viola City' },
    { id: 'hive', name: 'Insektorden', leader: 'Kai', city: 'Azalea City' },
    { id: 'plain', name: 'Basisorden', leader: 'Bianka', city: 'Dukatia City' },
    { id: 'fog', name: 'Phantomorden', leader: 'Jens', city: 'Teak City' },
    { id: 'storm', name: 'Faustorden', leader: 'Hartwig', city: 'Anemonia City' },
    { id: 'mineral', name: 'Stahlorden', leader: 'Jasmin', city: 'Oliviana City' },
    { id: 'glacier', name: 'Eisorden', leader: 'Norbert', city: 'Mahagonia City' },
    { id: 'rising', name: 'Drachenorden', leader: 'Sandra', city: 'Ebenholz City' },
    { id: 'thunder', name: 'Donnerorden', leader: 'Major Bob', city: 'Orania City' },
    { id: 'marsh', name: 'Sumpforden', leader: 'Sabrina', city: 'Saffronia City' },
    { id: 'cascade', name: 'Quellorden', leader: 'Misty', city: 'Azuria City' },
    { id: 'rainbow', name: 'Farborden', leader: 'Erika', city: 'Prismania City' },
    { id: 'soul', name: 'Seelenorden', leader: 'Janina', city: 'Fuchsania City' },
    { id: 'boulder', name: 'Felsorden', leader: 'Rocko', city: 'Marmoria City' },
    { id: 'volcano', name: 'Vulkanorden', leader: 'Pyro', city: 'Seeschauminseln' },
    { id: 'earth', name: 'Erdorden', leader: 'Blau', city: 'Vertania City' }
  ],
  basics: [
    { title: 'Die richtige Edition', text: 'Gold und Silber teilen den größten Teil der Geschichte. Dein Fortschritt wird hier für beide Editionen getrennt gespeichert.' },
    { title: 'Vor besonderen Begegnungen speichern', text: 'Vor einmaligen Pokémon und wichtigen Kämpfen lohnt sich ein Spielstand. Abhaken im Guide speichert deinen Fortschritt im Guide, nicht im Spiel.' },
    { title: 'VMs im Blick behalten', text: 'Eine VM zu besitzen reicht draußen häufig noch nicht: Du brauchst auch den passenden Orden und ein Pokémon, das die Attacke beherrscht.' },
    { title: 'Zeit im Spiel beachten', text: 'Begegnungen und Wochenereignisse richten sich nach der Uhr deines Spielstands. Der Guide stellt die Spieluhr nicht um.' }
  ],
  chapters: [
    chapter('neuborkia', 'Aufbruch in Neuborkia', 'New Bark Town', 'johto',
      'Deine Reise beginnt zu Hause. Professor Lind hat einen Auftrag für dich – und dein erstes Pokémon.', [20, 21], [
        step('start-clock', 'Stelle zu Beginn die Spieluhr und den Wochentag passend ein.'),
        step('start-gear', 'Sprich mit deiner Mutter und nimm den PokéCom entgegen.'),
        step('start-partner', 'Besuche Professor Lind und wähle Endivie, Feurigel oder Karnimani.'),
        step('start-route29', 'Verlasse Neuborkia nach Westen und folge Route 29 nach Rosalia City.')
      ], ['Dein Starter bleibt eine persönliche Wahl. Für die Arenen hilft ein Team mit verschiedenen Typen.']),
    chapter('mr-pokemon', 'Der Auftrag von Mr. Pokémon', 'Cherrygrove City · Routes 30 & 31', 'johto',
      'Hole das rätselhafte Ei ab und kehre anschließend zu Professor Lind zurück.', [22, 23, 20], [
        step('errand-map', 'Lass dir Rosalia City vom älteren Herrn zeigen und erhalte das Karten-Modul.'),
        step('errand-house', 'Gehe über Route 30 zum Haus von Mr. Pokémon. Nimm das Ei und von Professor Eich den Pokédex entgegen.'),
        step('errand-rival', 'Mache dich nach Linds Anruf auf den Rückweg und gewinne den ersten Kampf gegen deinen Rivalen.'),
        step('errand-deliver', 'Bringe das Ei in Linds Labor und beantworte die Fragen zum Diebstahl.'),
        step('errand-balls', 'Nimm die Pokébälle vom Assistenten. Reise anschließend über Rosalia und Route 30/31 nach Viola City.')
      ], ['Auf dem ersten Hinweg hast du noch keine Pokébälle. Nach der Rückkehr ins Labor kannst du dein Team erweitern.']),
    chapter('viola', 'Viola City & der Knofensa-Turm', 'Violet City · Sprout Tower', 'johto',
      'Trainiere im Turm und stelle dich deiner ersten Arena.', [24, 25], [
        step('viola-tower', 'Erkunde den Knofensa-Turm, besiege den Weisen an der Spitze und erhalte VM05 Blitz.'),
        step('viola-gym', 'Besiege Arenaleiter Falk und nimm den Flügelorden entgegen.', { badge: 'zephyr' }),
        step('viola-egg', 'Sprich nach Linds Anruf mit seinem Assistenten im Pokémon-Center und nimm das Ei mit.'),
        step('viola-south', 'Heile dein Team und setze die Reise südlich auf Route 32 fort.'),
        step('viola-trade', 'Optional: Tausche ein Knofensa gegen Onix in dem Haus in der Stadt.', { optional: true })
      ], ['Mit dem Flügelorden kannst du Blitz außerhalb eines Kampfes einsetzen. Das Ei braucht einen freien Platz im Team.']),
    chapter('einheitstunnel', 'Nach Süden zum Einheitstunnel', 'Route 32 · Union Cave · Route 33', 'johto',
      'Route 32 und der Einheitstunnel verbinden Viola mit Azalea City.', [26, 28, 29], [
        step('union-rod', 'Sprich im Pokémon-Center auf Route 32 mit dem Angler und nimm die Angel entgegen.'),
        step('union-cross', 'Durchquere den erreichbaren Hauptweg des Einheitstunnels bis zum Ausgang nach Route 33.'),
        step('union-azalea', 'Folge Route 33 nach Azalea City und erkundige dich nach den verschwundenen Flegmon.')
      ], ['Abzweige, für die du Surfer oder Stärke brauchst, kannst du später erkunden. Der Hauptweg bleibt für den ersten Besuch zugänglich.']),
    chapter('azalea', 'Die Flegmon von Azalea City', 'Azalea Town · Slowpoke Well', 'johto',
      'Hilf Kurt im Flegmon-Brunnen. Danach wartet die zweite Arena.', [29, 30], [
        step('azalea-kurt', 'Besuche Kurt in seinem Haus. Folge ihm anschließend zum Flegmon-Brunnen.'),
        step('azalea-rockets', 'Besiege die Team-Rocket-Mitglieder im Brunnen und befreie die Flegmon.'),
        step('azalea-gym', 'Besiege Arenaleiter Kai und erhalte den Insektorden.', { badge: 'hive' }),
        step('azalea-rival', 'Bereite dein Team vor und besiege den Rivalen am Weg zum Steineichenwald.'),
        step('azalea-ball', 'Optional: Hole Kurts Geschenk ab und bringe ihm Aprikokos für weitere Bälle.', { optional: true })
      ], ['Kais Sichlor kann mit aufeinanderfolgenden Zornklinge-Angriffen gefährlich werden. Lass den Kampf möglichst nicht unkontrolliert in die Länge gehen.']),
    chapter('steineichenwald', 'Durch den Steineichenwald', 'Ilex Forest · Route 34', 'johto',
      'Ein entlaufenes Porenta versperrt den Fortschritt des Köhlers. Hilf, bevor du weiterreist.', [31], [
        step('ilex-bird', 'Treibe Porenta zurück zum Lehrling und nimm vom Köhler VM01 Zerschneider entgegen.'),
        step('ilex-cut', 'Bringe einem geeigneten Pokémon Zerschneider bei und entferne den Baum, der den weiteren Weg versperrt.'),
        step('ilex-route34', 'Verlasse den Wald nach Norden und folge Route 34 nach Dukatia City.'),
        step('ilex-headbutt', 'Optional: Sprich im Wald mit dem Mann, der dir TM02 Kopfnuss gibt.', { optional: true })
      ], ['Die Pension auf Route 34 ist ein späterer Anlaufpunkt für Zucht und Training. Du musst sie für die Geschichte noch nicht benutzen.']),
    chapter('dukatia', 'Großstadt Dukatia', 'Goldenrod City', 'johto',
      'Fahrrad, Radio und die Normal-Arena: In Dukatia gibt es vor der Weiterreise einiges zu tun.', [32, 33, 34, 35], [
        step('golden-bike', 'Hole im Fahrradladen ein Fahrrad ab.'),
        step('golden-radio', 'Beantworte das Quiz im Radioturm und erhalte das Radio-Modul für den PokéCom.'),
        step('golden-gym', 'Besiege Bianka, sprich nach ihrem ersten Rückzug erneut mit ihr und nimm den Basisorden entgegen.', { badge: 'plain' }),
        step('golden-bottle', 'Hole nach dem Arenasieg die Schiggykanne im Blumenladen.'),
        step('golden-north', 'Verlasse die Stadt über Route 35 in Richtung Nationalpark und Route 36.'),
        step('golden-coin', 'Optional: Suche im Untergrund nach dem Münzkorb.', { optional: true })
      ], ['Biankas Miltank setzt auf Walzer. Ein Kampf-Pokémon ist eine mögliche Antwort; im Kaufhaus wird ein Traumato gegen Machollo getauscht.']),
    chapter('mogelbaum', 'Nationalpark & der seltsame Baum', 'National Park · Routes 36 & 37', 'johto',
      'Mit der Schiggykanne kannst du den Weg nach Teak City öffnen.', [36, 37], [
        step('sudo-route', 'Erreiche den auffälligen Baum auf Route 36 über den Nationalpark oder den Verbindungsweg.'),
        step('sudo-water', 'Speichere im Spiel, benutze die Schiggykanne und fange oder besiege Mogelbaum.'),
        step('sudo-smash', 'Sprich nach dem Kampf mit dem Mann in der Nähe und erhalte TM08 Zertrümmerer.'),
        step('sudo-teak', 'Folge Route 37 nach Norden bis Teak City.')
      ], ['Mogelbaum ist in diesen Spielen eine einmalige Begegnung. Speichere vor dem Gießen, wenn du es fangen möchtest.']),
    chapter('teak', 'Die Türme von Teak City', 'Ecruteak City · Burned Tower', 'johto',
      'Die Kimono-Girls geben dir Zugang zu einer wichtigen VM. Ein Besuch in der Turmruine eröffnet einen weiteren Teil des Abenteuers.', [38, 39], [
        step('teak-bill', 'Sprich im Pokémon-Center mit Bill.'),
        step('teak-surf', 'Besiege die fünf Kimono-Girls im Tanztheater und hole beim Zuschauer VM03 Surfer ab.'),
        step('teak-tower', 'Erkunde die Turmruine, besiege deinen Rivalen und begegne im Untergeschoss den drei legendären Pokémon.'),
        step('teak-gym', 'Besiege Arenaleiter Jens und erhalte den Phantomorden.', { badge: 'fog' }),
        step('teak-west', 'Reise über Route 38 und Route 39 nach Oliviana City.')
      ], ['Mit dem Phantomorden wird Surfer außerhalb von Kämpfen nutzbar. Die drei Pokémon aus der Turmruine wandern danach durch Johto.']),
    chapter('leuchtturm', 'Das Licht von Oliviana', 'Olivine City · Lighthouse', 'johto',
      'Jasmin fehlt in der Arena. Suche sie im Leuchtturm und finde heraus, was dem dortigen Pokémon fehlt.', [41, 42, 43], [
        step('olive-strength', 'Hole VM04 Stärke beim Seemann in einem der Häuser von Oliviana.'),
        step('olive-light', 'Kämpfe dich durch den Leuchtturm bis zu Jasmin und dem kranken Ampharos.'),
        step('olive-errand', 'Sprich mit Jasmin über die Medizin und bereite die Überfahrt nach Anemonia vor.'),
        step('olive-goodrod', 'Optional: Hole die Profiangel beim Angler in Oliviana ab.', { optional: true })
      ], ['Du brauchst Surfer für den Seeweg. Die Strudelinseln kannst du auf der ersten Überfahrt noch auslassen.']),
    chapter('anemonia', 'Über das Meer nach Anemonia', 'Routes 40 & 41 · Cianwood City', 'johto',
      'Besorge den Geheimtrank und fordere den Kampf-Arenaleiter heraus.', [44, 46], [
        step('cian-cross', 'Surfe über Route 40 und Route 41 nach Anemonia City.'),
        step('cian-potion', 'Erkläre in der Apotheke das Problem im Leuchtturm und nimm den Geheimtrank mit.'),
        step('cian-gym', 'Nutze Stärke für das Felsenrätsel in der Arena und besiege Hartwig.', { badge: 'storm' }),
        step('cian-fly', 'Sprich nach dem Sieg mit Hartwigs Frau vor der Arena und erhalte VM02 Fliegen.')
      ], ['Der Faustorden erlaubt Fliegen außerhalb des Kampfes. Damit kommst du schnell zurück nach Oliviana.']),
    chapter('jasmin', 'Jasmins Rückkehr in die Arena', 'Olivine City', 'johto',
      'Bringe den Geheimtrank zum Leuchtturm. Danach kannst du Jasmin herausfordern.', [42, 43], [
        step('jasmine-heal', 'Kehre zu Jasmin im Leuchtturm zurück und übergib die Medizin für Ampharos.'),
        step('jasmine-gym', 'Besiege Jasmin in ihrer Arena und erhalte den Stahlorden.', { badge: 'mineral' }),
        step('jasmine-east', 'Reise von Teak City über Route 42 weiter nach Mahagonia City.')
      ], ['Jasmin verwendet Magnetilo und Stahlos. Plane passende Attacken ein und beachte die jeweiligen Zweittypen.']),
    chapter('see-des-zorns', 'Das rote Garados', 'Mahogany Town · Route 43 · Lake of Rage', 'johto',
      'Am See des Zorns stimmt etwas nicht. Die Spur führt zu Team Rocket.', [49, 50, 51], [
        step('rage-north', 'Gehe von Mahagonia über Route 43 zum See des Zorns. Der Grasweg umgeht die Rocket-Maut.'),
        step('rage-gyarados', 'Speichere vor der Begegnung im Spiel und fange oder besiege das rote Garados auf dem See.'),
        step('rage-lance', 'Sprich am Ufer mit Siegfried und sage deine Hilfe zu.'),
        step('rage-shop', 'Kehre nach Mahagonia zurück und triff Siegfried im verdächtigen Laden.'),
        step('rage-scale', 'Optional: Tausche die Rote Haut bei Mr. Pokémon gegen einen EP-Teiler.', { optional: true })
      ], ['Du musst die Begegnung mit Garados abschließen, um die Handlung mit Siegfried fortzusetzen.']),
    chapter('rocket-versteck', 'Unter Mahagonia City', 'Team Rocket Hideout · Mahogany Gym', 'johto',
      'Schalte das Sendesignal im Rocket-Versteck ab und öffne den Weg zur Eis-Arena.', [49, 51], [
        step('hideout-alarm', 'Erkunde das Versteck und schalte die Statuen-Alarme am Computer aus.'),
        step('hideout-codes', 'Besiege die Rocket-Mitglieder, die dir die zwei Passwörter für das Büro geben.'),
        step('hideout-bird', 'Besiege den Anführer im Büro und sprich mit Kramurx, um das letzte Passwort zu erfahren.'),
        step('hideout-power', 'Erreiche den Generatorraum und erledige deinen Teil der Lektrobal-Begegnungen.'),
        step('hideout-whirl', 'Nimm von Siegfried VM06 Whirlpool entgegen.'),
        step('hideout-gym', 'Besiege Norbert in der Arena von Mahagonia und erhalte den Eisorden.', { badge: 'glacier' })
      ], ['Die Reihenfolge einiger Johto-Arenen ist flexibel. Dieser Guide führt zuerst über Anemonia und Oliviana, dann nach Mahagonia.']),
    chapter('radioturm', 'Team Rocket im Radioturm', 'Goldenrod Radio Tower · Underground', 'johto',
      'Nach sieben Johto-Orden besetzt Team Rocket den Radioturm. Kehre nach Dukatia zurück.', [52, 53, 54], [
        step('radio-fake', 'Kämpfe dich im Radioturm zum falschen Intendanten vor und erhalte den Kelleröffner.'),
        step('radio-under', 'Öffne im Dukatia-Untergrund die verschlossene Tür und besiege deinen Rivalen.'),
        step('radio-switches', 'Löse das Schalterrätsel: Betätige die drei Schalter von rechts nach links, also 3 → 2 → 1.'),
        step('radio-director', 'Befreie den echten Intendanten im Lagerbereich und nimm die Schlüsselkarte entgegen.'),
        step('radio-finish', 'Kehre zum Radioturm zurück, öffne den abgesperrten Bereich und besiege die restlichen Rocket-Mitglieder.'),
        step('radio-goldwing', 'Nimm vom Intendanten die Buntschwinge entgegen.', { editions: ['gold'] }),
        step('radio-silverwing', 'Nimm vom Intendanten den Silberflügel entgegen.', { editions: ['silver'] })
      ], ['Wenn du beim Schalterrätsel durcheinanderkommst, verlasse die Ebene und starte den Versuch neu.']),
    chapter('eispfad', 'Der Eispfad', 'Route 44 · Ice Path', 'johto',
      'Der Weg nach Ebenholz führt über rutschige Böden und ein Felsenrätsel.', [54, 55], [
        step('ice-route44', 'Verlasse Mahagonia nach Osten und folge Route 44 zum Eispfad.'),
        step('ice-waterfall', 'Hole VM07 Kaskade auf dem seitlichen Eisfeld ab, bevor du tiefer in die Höhle gehst.'),
        step('ice-boulders', 'Schiebe mit Stärke die vier Felsen durch die vorgesehenen Löcher. Nutze sie unten als Stopper auf dem Eis.'),
        step('ice-exit', 'Durchquere die weiteren Eisflächen und verlasse die Höhle nach Ebenholz City.')
      ], ['Auf Eis rutschst du bis zum nächsten Hindernis. Stärke muss ein Pokémon im Team bereits beherrschen.']),
    chapter('ebenholz', 'Sandra & die Drachenhöhle', 'Blackthorn City · Dragon’s Den', 'johto',
      'Ein Arenasieg allein genügt Sandra noch nicht. Eine letzte Aufgabe trennt dich vom achten Johto-Orden.', [56, 57], [
        step('blackthorn-gym', 'Löse das Stärke-Rätsel in der Arena und besiege Sandra.'),
        step('blackthorn-den', 'Betritt die Drachenhöhle hinter der Arena. Nimm Pokémon mit Surfer und Whirlpool mit.'),
        step('blackthorn-fang', 'Hole den Drachenzahn und nimm von Sandra den Drachenorden entgegen.', { badge: 'rising' }),
        step('blackthorn-elm', 'Kehre nach Linds Anruf ins Labor in Neuborkia zurück und hole den Meisterball ab.')
      ], ['Diese Aufgabe gilt für Gold und Silber. Die Drachenhöhlen-Prüfung aus anderen Editionen gehört nicht zu diesem Spielverlauf.']),
    chapter('siegerstrasse', 'Der Weg zur Pokémon-Liga', 'Routes 27 & 26 · Victory Road', 'league',
      'Von Neuborkia führt der Weg über die Tohjo-Fälle und die Siegesstraße zum Indigo-Plateau.', [58, 59], [
        step('league-east', 'Surfe von Neuborkia nach Osten auf Route 27 und durchquere die Tohjo-Fälle mit Kaskade.'),
        step('league-route26', 'Folge Route 27 und Route 26 zum Kontrolltor der Pokémon-Liga.'),
        step('league-gate', 'Zeige deine acht Johto-Orden vor und betrete die Siegesstraße.'),
        step('league-rival', 'Durchquere die Höhle und besiege deinen Rivalen vor dem Ausgang.'),
        step('league-supplies', 'Heile dein Team am Indigo-Plateau und kaufe Heilmittel, Beleber und Mittel gegen Statusprobleme.')
      ], ['Die Kanto-Abzweige am Kontrolltor sind noch gesperrt. Für den Weg zu den Top Vier geht es zunächst geradeaus weiter.']),
    chapter('top-vier', 'Die Top Vier & der Champ', 'Indigo Plateau · Elite Four', 'league',
      'Fünf Kämpfe hintereinander entscheiden über deinen ersten Einzug in die Ruhmeshalle.', [60], [
        step('elite-will', 'Besiege Willi und sein Team mit Schwerpunkt auf Psycho-Pokémon.'),
        step('elite-koga', 'Besiege Koga und achte auf Vergiftung sowie andere Statusprobleme.'),
        step('elite-bruno', 'Besiege Bruno. Plane neben seinen Kampf-Pokémon auch für Onix.'),
        step('elite-karen', 'Besiege Melanie. Ihr Team umfasst neben Unlicht auch weitere Typen.'),
        step('elite-lance', 'Besiege Champ Siegfried und sein Team, darunter mehrere Dragoran.'),
        step('elite-hall', 'Lass dein Team in die Ruhmeshalle eintragen und lade danach den fortgesetzten Spielstand.')
      ], ['Zwischen den Kämpfen gibt es kein Pokémon-Center. Heile rechtzeitig mit Items. Eis-Attacken helfen gegen Dragoran; Elektro hilft gegen mehrere andere Teammitglieder.']),
    chapter('ms-aqua', 'Mit der M.S. Aqua nach Kanto', 'S.S. Aqua · Olivine to Vermilion', 'kanto',
      'Die Ruhmeshalle ist erst die Halbzeit. Professor Lind hat ein Ticket für die nächste Region.', [20, 61, 62], [
        step('aqua-ticket', 'Hole nach der Liga bei Professor Lind das Bootsticket ab.'),
        step('aqua-board', 'Gehe zum Hafen in Oliviana und besteige die M.S. Aqua.'),
        step('aqua-sailor', 'Suche den schlafenden Matrosen in der Kabine neben deiner und bringe ihn zurück an die Arbeit.'),
        step('aqua-child', 'Finde die Enkelin des alten Mannes beim Kapitän und erhalte als Dank den Metallmantel.'),
        step('aqua-arrive', 'Verlasse das Schiff nach der Ankunft in Orania City.')
      ], ['Nach der ersten Überfahrt fährt das Schiff ab Oliviana montags und freitags, ab Orania mittwochs und sonntags. Maßgeblich ist der Wochentag im Spiel.']),
    chapter('orania', 'Die Arena von Orania City', 'Vermilion City · Lt. Surge', 'kanto',
      'Der erste Kanto-Orden liegt gleich in der Hafenstadt. Viele weitere Arenen lassen sich in unterschiedlicher Reihenfolge besuchen.', [62], [
        step('vermilion-enter', 'Erreiche die Arena von Orania mit Zerschneider oder über das Wasser.'),
        step('vermilion-gym', 'Besiege Major Bob und erhalte den Donnerorden.', { badge: 'thunder' }),
        step('vermilion-north', 'Folge Route 6 nach Saffronia City.')
      ], ['Ein Boden-Pokémon ist gegen Elektro-Attacken gut geschützt. Relaxo vor der Digda-Höhle wird später wichtig.']),
    chapter('saffronia', 'Sabrinas Psycho-Arena', 'Saffron City', 'kanto',
      'In Saffronia wartet Sabrina. Der Magnetzug steht noch still, bis das Kraftwerk wieder funktioniert.', [63, 64], [
        step('saffron-gym', 'Finde über die Teleporter den Weg zu Sabrina und besiege sie.', { badge: 'marsh' }),
        step('saffron-east', 'Reise über Route 8 nach Lavandia und weiter in Richtung Felstunnel und Kraftwerk.')
      ], ['Für die Kanto-Arenen gibt es keine einzige feste Reihenfolge. Dieser Reiseplan verbindet die Arenen mit den nötigen Aufgaben für die Westhälfte der Region.']),
    chapter('kraftwerk', 'Das fehlende Maschinenteil', 'Power Plant · Cerulean City · Routes 24 & 25', 'kanto',
      'Die Stromversorgung verbindet mehrere Aufgaben in Kanto. Beginne mit einem Besuch im Kraftwerk.', [66, 67, 68], [
        step('power-manager', 'Erreiche das Kraftwerk auf Route 10 und sprich mit dem Leiter sowie dem Polizisten über das gestohlene Teil.'),
        step('power-rocket', 'Gehe zur Arena in Azuria City und begegne dem verdächtigen Rocket-Mitglied.'),
        step('power-bridge', 'Folge ihm zur Route 24, besiege ihn und erfahre, wo das Teil versteckt ist.'),
        step('power-part', 'Suche in der Arena von Azuria am kleinen Wasserbecken nach der Spule.'),
        step('power-return', 'Bringe die Spule zum Kraftwerk zurück und stelle die Stromversorgung wieder her.')
      ], ['Blitz macht den Felstunnel übersichtlicher. Der Detektor hilft bei der Suche nach versteckten Items.']),
    chapter('azuria', 'Misty zurück in die Arena holen', 'Cerulean City · Route 25', 'kanto',
      'Nach der Suche nach der Spule fehlt noch die Arenaleiterin selbst.', [67, 68], [
        step('cerulean-misty', 'Gehe auf Route 25 bis zu Mistys Treffpunkt am Wasser und sprich sie an.'),
        step('cerulean-gym', 'Kehre zur Arena in Azuria zurück, besiege Misty und erhalte den Quellorden.', { badge: 'cascade' })
      ], ['Pflanzen- und Elektro-Attacken helfen gegen viele ihrer Pokémon. Achte trotzdem auf die unterschiedlichen Zweittypen.']),
    chapter('radiomodul-kanto', 'Das Radio funktioniert wieder', 'Lavender Town · Copycat · Magnet Train', 'kanto',
      'Mit der wiederhergestellten Stromversorgung kannst du das Radio in Kanto erweitern.', [64, 65, 62], [
        step('lavender-card', 'Sprich im Radioturm von Lavandia mit dem Verantwortlichen und erhalte das Zusatzmodul.'),
        step('train-copycat', 'Optional: Sprich in Saffronia mit der Nachahmerin über ihre verlorene Poképuppe.', { optional: true }),
        step('train-doll', 'Optional: Hole die Poképuppe beim Mann im Pokémon-Fanclub von Orania ab.', { optional: true }),
        step('train-pass', 'Optional: Bringe die Puppe zurück und erhalte den Fahrschein für den Magnetzug.', { optional: true })
      ], ['Das Zusatzmodul brauchst du für den Pokéflöten-Sender vor Relaxo. Der Magnetzug erleichtert die Reise zwischen Saffronia und Dukatia.']),
    chapter('prismania', 'Erikas Garten', 'Celadon City', 'kanto',
      'Von Saffronia führt Route 7 nach Prismania. Hier wartet die Pflanzen-Arena.', [69, 70, 71], [
        step('celadon-route', 'Reise nach Prismania und erreiche Erikas Arena.'),
        step('celadon-gym', 'Besiege Erika und erhalte den Farborden.', { badge: 'rainbow' })
      ], ['Feuer- oder Flug-Attacken sind gegen viele Pflanzen-Pokémon hilfreich. Halte auch Heilmittel gegen Statusprobleme bereit.']),
    chapter('fuchsania', 'Janinas Versteckspiel', 'Fuchsia City', 'kanto',
      'Kogas Tochter leitet inzwischen die Arena. Die Trainerinnen und Trainer machen es dir nicht leicht, sie sofort zu erkennen.', [71, 72, 73, 74], [
        step('fuchsia-route', 'Erreiche Fuchsania über den Radweg oder die östlichen Routen.'),
        step('fuchsia-gym', 'Finde die echte Janina in der Arena und besiege sie für den Seelenorden.', { badge: 'soul' }),
        step('fuchsia-superrod', 'Optional: Hole die Superangel im Anglerhaus auf Route 12.', { optional: true })
      ], ['Die Safari-Zone ist in Gold und Silber geschlossen. Der direkte Weg nach Süden ist zunächst durch Bauarbeiten blockiert.']),
    chapter('relaxo-marmoria', 'Relaxo & der Weg nach Marmoria', 'Snorlax · Diglett’s Cave · Pewter City', 'kanto',
      'Das Zusatzmodul öffnet über den Pokéflöten-Sender den Weg in den westlichen Teil von Kanto.', [62, 65, 69, 74, 75], [
        step('snorlax-radio', 'Stelle vor Relaxo den PokéCom auf den Pokéflöten-Sender. Speichere im Spiel und sprich Relaxo an.'),
        step('snorlax-battle', 'Fange oder besiege Relaxo und durchquere anschließend die Digda-Höhle.'),
        step('pewter-route', 'Gehe über Route 2 nach Marmoria City.'),
        step('pewter-gym', 'Besiege Rocko und erhalte den Felsorden.', { badge: 'boulder' }),
        step('pewter-goldwing', 'Optional: Sprich mit dem alten Mann in Marmoria und erhalte den Silberflügel.', { editions: ['gold'], optional: true }),
        step('pewter-silverwing', 'Optional: Sprich mit dem alten Mann in Marmoria und erhalte die Buntschwinge.', { editions: ['silver'], optional: true })
      ], ['Vor der Relaxo-Begegnung lohnt sich ein separater Spielstand. Der Pokéflöten-Sender wird erst durch das Zusatzmodul zugänglich.']),
    chapter('zinnober', 'Zinnoberinsel & Pyros neue Arena', 'Pallet Town · Cinnabar Island · Seafoam Islands', 'kanto',
      'Über Alabastia erreichst du die vom Vulkan gezeichnete Insel. Pyro hat seine Arena verlegt.', [77, 78, 79], [
        step('cinnabar-route', 'Reise von Marmoria über Vertania nach Alabastia und surfe von dort nach Süden zur Zinnoberinsel.'),
        step('cinnabar-blue', 'Sprich auf der Zinnoberinsel mit Blau.'),
        step('cinnabar-blaine', 'Surfe nach Osten zu den Seeschauminseln, besiege Pyro in seiner neuen Arena und erhalte den Vulkanorden.', { badge: 'volcano' })
      ], ['Wasser-, Boden- und Gestein-Attacken helfen gegen Pyros Feuer-Pokémon. Der bisher gesperrte Seeweg nach Fuchsania wird von dieser Seite wieder zugänglich.']),
    chapter('vertania', 'Blau in Vertania City', 'Viridian City', 'kanto',
      'Nachdem du ihn auf der Zinnoberinsel getroffen hast, wartet Blau in seiner Arena.', [77, 78, 79], [
        step('viridian-badges', 'Prüfe deine Orden und hole noch fehlende Kanto-Arenasiege nach.'),
        step('viridian-gym', 'Fordere Blau in Vertania heraus, besiege sein vielseitiges Team und erhalte den Erdorden.', { badge: 'earth' })
      ], ['Blau beschränkt sich nicht auf einen Typ. Ein ausgeglichenes Team ist hier hilfreicher als eine einzelne passende Attacke.']),
    chapter('silberberg', 'Das Finale am Silberberg', 'Mt. Silver · Red', 'kanto',
      'Mit allen 16 Orden kannst du den letzten Abschnitt deiner Reise freischalten.', [78, 80, 81], [
        step('silver-oak', 'Besuche Professor Eich in Alabastia, nachdem du alle acht Kanto-Orden erhalten hast.'),
        step('silver-gate', 'Reise zum Kontrolltor der Pokémon-Liga und nimm den nun offenen Weg zur Route 28.'),
        step('silver-center', 'Erreiche das Pokémon-Center am Silberberg, heile dein Team und bereite dich auf den letzten Aufstieg vor.'),
        step('silver-red', 'Durchquere den Silberberg und besiege Rot am Ende der Höhle.')
      ], ['Blitz erleichtert die Orientierung. Für alle Nebenbereiche sind weitere VMs nötig, für den direkten Weg zu Rot jedoch nicht jede davon. Rot ist deutlich stärker als die vorherigen Gegner: Nimm ausreichend Heilmittel mit.']),
    chapter('alph-ruinen', 'Die Alph-Ruinen', 'Ruins of Alph · Unown', 'extras',
      'Ein freiwilliger Abstecher zu antiken Rätseln und den Icognito.', [27], [
        step('alph-puzzle', 'Setze das erreichbare erste Bildrätsel zusammen.'),
        step('alph-unown', 'Fange drei unterschiedliche Icognito-Formen.'),
        step('alph-dex', 'Sprich mit dem Forscher und erhalte die Icognito-Erweiterung für den Pokédex.')
      ], ['Weitere Kammern werden erst mit zusätzlichen Wegen und VMs erreichbar. Du musst die Ruinen für den Arenenverlauf nicht vollständig lösen.'], { optional: true }),
    chapter('legendaere', 'Ho-Oh & Lugia', 'Tin Tower · Whirl Islands', 'extras',
      'Beide legendären Pokémon sind in beiden Editionen erreichbar. Die Reihenfolge der benötigten Schwingen unterscheidet sich.', [40, 45, 75, 97, 98], [
        step('legend-first-gold', 'Hole die Buntschwinge nach der Rettung des Radioturms. Bereite den Weg zu Ho-Oh im Zinnturm vor.', { editions: ['gold'] }),
        step('legend-first-silver', 'Hole den Silberflügel nach der Rettung des Radioturms. Bereite den Weg zu Lugia auf den Strudelinseln vor.', { editions: ['silver'] }),
        step('legend-hooh-gold', 'Erreiche mit der Buntschwinge die Spitze des Zinnturms und speichere vor der Begegnung mit Ho-Oh.', { editions: ['gold'] }),
        step('legend-lugia-silver', 'Erkunde mit Silberflügel sowie den nötigen Wasser-VMs die Strudelinseln. Speichere vor der Begegnung mit Lugia.', { editions: ['silver'] }),
        step('legend-other-gold', 'Hole in Marmoria den Silberflügel für die Begegnung mit Lugia.', { editions: ['gold'] }),
        step('legend-other-silver', 'Hole in Marmoria die Buntschwinge für die Begegnung mit Ho-Oh.', { editions: ['silver'] }),
        step('legend-lugia-gold', 'Erkunde mit Silberflügel sowie den nötigen Wasser-VMs die Strudelinseln. Speichere vor der Begegnung mit Lugia.', { editions: ['gold'] }),
        step('legend-hooh-silver', 'Erreiche mit der Buntschwinge die Spitze des Zinnturms und speichere vor der Begegnung mit Ho-Oh.', { editions: ['silver'] })
      ], ['In Gold erscheint Ho-Oh auf Level 40 und Lugia auf Level 70; in Silber ist es umgekehrt. Beide Begegnungen sind einmalig. Nimm genug Bälle und Heilmittel mit.'], { optional: true }),
    chapter('abstecher', 'Kleine Umwege, besondere Begegnungen', 'Lapras · Eevee · Mt. Moon', 'extras',
      'Diese Ziele lassen sich später in die Reise einbauen. Richte dich bei Wochenereignissen nach der Uhr im Spiel.', [28, 34, 36, 76, 98], [
        step('extra-lapras', 'Besuche freitags mit Surfer das untere Stockwerk des Einheitstunnels, um Lapras zu begegnen.'),
        step('extra-eevee', 'Hole nach Bills Besuch in Teak das Evoli in seinem Haus in Dukatia ab.'),
        step('extra-contest', 'Besuche das Käferturnier im Nationalpark an einem Dienstag, Donnerstag oder Samstag.'),
        step('extra-moon', 'Erkunde von Marmoria aus Route 3 und den Mondberg und besiege dort erneut deinen Rivalen.')
      ], ['Die wandernden Raikou, Entei und Suicune gehören in Gold und Silber ebenfalls zu den freiwilligen Fangzielen. Nach einer Begegnung kannst du ihre Position über den Pokédex verfolgen.'], { optional: true })
  ]
};
