import { PhoenixLoader } from './phoenix-loader';

/**
 * Edm4hepJsonLoader for loading EDM4hep json dumps
 */
export class Edm4hepJsonLoader extends PhoenixLoader {
  /**  Event data loaded from EDM4hep JSON file */
  private rawEventData: any;
  private magneticFieldStrength: any;
  private scale: number;

  /** Create Edm4hepJsonLoader */
  constructor(loaderConfiguration?: {
    magneticFieldStrength?: number;
    eventScale?: number;
  }) {
    super();
    this.eventData = {};
    this.scale = 1;
    // Use a new field to store information about magneticFieldStrength
    if (loaderConfiguration) {
      this.magneticFieldStrength = loaderConfiguration.magneticFieldStrength;
      if (loaderConfiguration.eventScale) {
        this.scale = loaderConfiguration.eventScale;
      }
    }
  }

  /** Put raw EDM4hep JSON event data into the loader */
  setRawEventData(rawEventData: any) {
    this.rawEventData = rawEventData;
  }

  /** Process raw EDM4hep JSON event data into the Phoenix format */
  processEventData(): boolean {
    Object.entries(this.rawEventData).forEach(([eventName, event]) => {
      const oneEventData = {
        Vertices: {},
        Tracks: {},
        Hits: {},
        CaloCells: {},
        CaloClusters: {},
        Jets: {},
        MissingEnergy: {},
        ReconstructedParticles: {},
        MCParticles: {},
        'event number': this.getEventNumber(event),
        'run number': this.getRunNumber(event),
      };

      oneEventData.Vertices = this.getVertices(event);
      oneEventData.Tracks = this.getTracks(event);
      oneEventData.Hits = this.getHits(event);
      oneEventData.CaloCells = this.getCells(event);
      oneEventData.CaloClusters = this.getCaloClusters(event);
      oneEventData.Jets = this.getJets(event);
      oneEventData.MissingEnergy = this.getMissingEnergy(event);
      oneEventData.ReconstructedParticles = this.getReconstructedParticles(
        event,
        oneEventData.Tracks,
        oneEventData.CaloClusters,
      );
      oneEventData.MCParticles = this.getMCParticles(event);

      this.eventData[eventName] = oneEventData;
    });

    return true;
  }

  /** Output event data in Phoenix compatible format */
  getEventData(): any {
    return this.eventData;
  }

  /** Return number of events */
  private getNumEvents(): number {
    return Object.keys(this.rawEventData).length;
  }

  /** Return run number (or 0, if not defined) */
  private getRunNumber(event: any): number {
    if (!('EventHeader' in event)) {
      return 0;
    }

    const eventHeader = event['EventHeader']['collection'];

    if (!('runNumber' in eventHeader)) {
      return eventHeader[0]['runNumber'];
    }

    return 0;
  }

  /** Return event number (or 0, if not defined) */
  private getEventNumber(event: any): number {
    if (!('EventHeader' in event)) {
      return 0;
    }

    const eventHeader = event['EventHeader']['collection'];

    if (!('eventNumber' in eventHeader)) {
      return eventHeader[0]['eventNumber'];
    }

    return 0;
  }

  /** Assign default color to Tracks*/
  private colorTracks(event: any) {
    let recoParticles: any[];
    if ('ReconstructedParticles' in event) {
      recoParticles = event['ReconstructedParticles']['collection'];
    } else {
      return;
    }

    let mcParticles: any[];
    if ('Particle' in event) {
      mcParticles = event['Particle']['collection'];
    } else {
      return;
    }

    let mcRecoAssocs: any[];
    if ('MCRecoAssociations' in event) {
      mcRecoAssocs = event['MCRecoAssociations']['collection'];
    } else {
      return;
    }

    let tracks: any[];
    if ('EFlowTrack' in event) {
      tracks = event['EFlowTrack']['collection'];
    } else {
      return;
    }

    mcRecoAssocs.forEach((mcRecoAssoc: any) => {
      const recoIndex = mcRecoAssoc['rec']['index'];
      const mcIndex = mcRecoAssoc['sim']['index'];

      const pdgid = mcParticles[mcIndex]['PDG'];
      const trackRefs = recoParticles[recoIndex]['tracks'];

      trackRefs.forEach((trackRef: any) => {
        const track = tracks[trackRef['index']];
        if (Math.abs(pdgid) === 11) {
          track['color'] = '00ff00';
          track['pid'] = 'electron';
        } else if (Math.abs(pdgid) === 22) {
          track['color'] = 'ff0000';
          track['pid'] = 'photon';
        } else if (Math.abs(pdgid) === 211 || Math.abs(pdgid) === 111) {
          track['color'] = 'a52a2a';
          track['pid'] = 'pion';
        } else if (Math.abs(pdgid) === 2212) {
          track['color'] = '778899';
          track['pid'] = 'proton';
        } else if (Math.abs(pdgid) === 321) {
          track['color'] = '5f9ea0';
          track['pid'] = 'kaon';
        } else {
          track['color'] = '0000cd';
          track['pid'] = 'other';
        }
        track['pdgid'] = pdgid;
      });
    });
  }

  /** Return the vertices */
  private getVertices(event: any) {
    const allVertices: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      if (!(collDict['collType'] === 'edm4hep::VertexCollection')) {
        continue;
      }

      const vertices: any[] = [];
      const rawVertices = collDict['collection'];
      const vertexColor = this.randomColor();

      rawVertices.forEach((rawVertex: any) => {
        const position: any[] = [];
        if ('position' in rawVertex) {
          position.push(rawVertex['position']['x'] * 0.1 * this.scale);
          position.push(rawVertex['position']['y'] * 0.1 * this.scale);
          position.push(rawVertex['position']['z'] * 0.1 * this.scale);
        }

        const vertex = {
          pos: position,
          size: 0.2,
          color: '#' + vertexColor,
        };
        vertices.push(vertex);
      });

      allVertices[collName] = vertices;
    }

    return allVertices;
  }

  /** Return tracks */
  private getTracks(event: any) {
    const allTracks: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!(collDict['collType'] === 'edm4hep::TrackCollection')) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      let collID = null;
      if ('collID' in collDict) {
        collID = collDict['collID'];
      }

      const rawTracks = collDict['collection'];
      const electrons: any[] = [];
      const photons: any[] = [];
      const pions: any[] = [];
      const protons: any[] = [];
      const kaons: any[] = [];
      const other: any[] = [];

      let index = 0;
      rawTracks.forEach((rawTrack: any) => {
        const positions: any[] = [];
        if ('trackerHits' in rawTrack) {
          const trackerHitRefs = rawTrack['trackerHits'];
          trackerHitRefs.forEach((trackerHitRef: any) => {
            const trackerHits = this.getCollByID(
              event,
              trackerHitRef['collectionID'],
            );
            if (
              trackerHits &&
              'index' in trackerHitRef &&
              trackerHitRef['index'] >= 0 &&
              trackerHitRef['index'] < trackerHits.length
            ) {
              const trackerHit = trackerHits[trackerHitRef['index']];

              positions.push([
                trackerHit['position']['x'] * 0.1 * this.scale,
                trackerHit['position']['y'] * 0.1 * this.scale,
                trackerHit['position']['z'] * 0.1 * this.scale,
              ]);
            }
          });
        }
        if ('trackStates' in rawTrack && positions.length === 0) {
          const trackStates = rawTrack['trackStates'];
          trackStates.forEach((trackState: any) => {
            if ('referencePoint' in trackState) {
              positions.push([
                trackState['referencePoint']['x'] * 0.1 * this.scale,
                trackState['referencePoint']['y'] * 0.1 * this.scale,
                trackState['referencePoint']['z'] * 0.1 * this.scale,
              ]);
            }
          });
        }

        let trackColor = 'ee2222';
        if ('color' in rawTrack) {
          trackColor = rawTrack['color'];
        }

        let chi2: number = -1;
        if ('chi2' in rawTrack) {
          chi2 = rawTrack['chi2'];
        }

        const track = {
          pos: positions,
          color: trackColor,
          chi_square: chi2,
          collID: collID,
          index: index,
          size: this.scale,
          associatedParticle: null,
        };

        if ('pid' in rawTrack) {
          if (rawTrack['pid'] == 'electron') {
            electrons.push(track);
          } else if (rawTrack['pid'] == 'photon') {
            photons.push(track);
          } else if (rawTrack['pid'] == 'pion') {
            pions.push(track);
          } else if (rawTrack['pid'] == 'proton') {
            protons.push(track);
          } else if (rawTrack['pid'] == 'kaon') {
            kaons.push(track);
          } else {
            other.push(track);
          }
        } else {
          other.push(track);
        }
        index++;
      });

      allTracks[collName + ' | Electrons'] = electrons;
      allTracks[collName + ' | Photons'] = photons;
      allTracks[collName + ' | Pions'] = pions;
      allTracks[collName + ' | Protons'] = protons;
      allTracks[collName + ' | Kaons'] = kaons;
      allTracks[collName + ' | Other'] = other;
    }

    return allTracks;
  }

  /** Not implemented */
  private getHits(event: any) {
    const allHits: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!collDict['collType'].includes('edm4hep::')) {
        continue;
      }

      if (!collDict['collType'].includes('TrackerHitCollection')) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const rawHits = collDict['collection'];
      const hits: any[] = [];
      const hitColor = this.randomColor();

      rawHits.forEach((rawHit: any) => {
        const position: any[] = [];
        if ('position' in rawHit) {
          position.push(rawHit['position']['x'] * 0.1 * this.scale);
          position.push(rawHit['position']['y'] * 0.1 * this.scale);
          position.push(rawHit['position']['z'] * 0.1 * this.scale);
        }

        const hit = {
          type: 'CircularPoint',
          pos: position,
          color: '#' + hitColor,
          size: 2 * this.scale,
        };
        hits.push(hit);
      });

      allHits[collName] = hits;
    }

    return allHits;
  }

  /** Returns the cells */
  private getCells(event: any) {
    const allCells: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!collDict['collType'].includes('edm4hep::')) {
        continue;
      }

      if (!collDict['collType'].includes('CalorimeterHitCollection')) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const rawCells = collDict['collection'];
      const cells: any[] = [];
      const cellsHue = Math.floor(Math.random() * 358);

      rawCells.forEach((rawCell: any) => {
        const x = rawCell.position.x * 0.1 * this.scale;
        const y = rawCell.position.y * 0.1 * this.scale;
        const z = rawCell.position.z * 0.1 * this.scale;

        const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        const rho = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        const eta = Math.asinh(z / rho);
        const phi = Math.acos(x / rho) * Math.sign(y);
        const cellLightness = this.valToLightness(rawCell.energy, 1e-3, 1);
        const cellOpacity = this.valToOpacity(rawCell.energy, 1e-3, 1);

        const cellSide = Math.log(1 + rawCell.energy) + 1.5;

        const cell = {
          eta: eta,
          phi: phi,
          energy: rawCell.energy,
          radius: r,
          side: cellSide * this.scale,
          length: cellSide * this.scale, // expecting cells in multiple layers
          color: '#' + this.convHSLtoHEX(cellsHue, 90, cellLightness),
          opacity: cellOpacity,
        };
        cells.push(cell);
      });

      allCells[collName] = cells;
    }

    return allCells;
  }

  /** Return Calo clusters */
  private getCaloClusters(event: any) {
    const allClusters: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (!(collDict['collType'] === 'edm4hep::ClusterCollection')) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      let collID = null;
      if ('collID' in collDict) {
        collID = collDict['collID'];
      }

      const rawClusters = collDict['collection'];
      const clusters: any[] = [];

      let index = 0;
      rawClusters.forEach((rawCluster: any) => {
        const x = rawCluster.position.x * 0.1 * this.scale;
        const y = rawCluster.position.y * 0.1 * this.scale;
        const z = rawCluster.position.z * 0.1 * this.scale;

        const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        const rho = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        const eta = Math.asinh(z / rho);
        const phi = Math.acos(x / rho) * Math.sign(y);

        const cluster = {
          eta: eta,
          phi: phi,
          energy: rawCluster.energy,
          radius: r,
          side: 4 * this.scale,
          collID: collID,
          index: index,
          associatedParticle: null,
          length: rawCluster.energy * this.scale,
        };
        clusters.push(cluster);
        index++;
      });

      allClusters[collName] = clusters;
    }

    return allClusters;
  }

  /** Return jets */
  private getJets(event: any) {
    const allJets: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (
        !(collDict['collType'] === 'edm4hep::ReconstructedParticleCollection')
      ) {
        continue;
      }

      if (!(collName.includes('Jet') || collName.includes('jet'))) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const jets: any[] = [];
      const rawJets = collDict['collection'];

      rawJets.forEach((rawJet: any) => {
        if (!('momentum' in rawJet)) {
          return;
        }
        if (!('energy' in rawJet)) {
          return;
        }
        const px = rawJet['momentum']['x'];
        const py = rawJet['momentum']['y'];
        const pz = rawJet['momentum']['z'];

        const pt = Math.sqrt(Math.pow(px, 2) + Math.pow(py, 2));
        const eta = Math.asinh(pz / pt);
        const phi = Math.acos(px / pt) * Math.sign(py);

        const jet = {
          eta: eta,
          phi: phi,
          energy: 1000 * rawJet.energy,
        };
        jets.push(jet);
      });
      allJets[collName] = jets;
    }

    return allJets;
  }
  /*return reconstructed particles*/
  private getReconstructedParticles(
    event: any,
    trackCollections?: { [key: string]: any[] },
    clusterCollections?: { [key: string]: any[] },
  ) {
    // trackCollections is a dictionary, whose key is its collName.
    const ReconstructedParticleCollections = {};
    const trackDict = {};
    const clusterDict = {};
    // Here we use dictionaries to map collectionID & index to tracks, clusters...
    if (trackCollections != null) {
      for (const tracks of Object.values(trackCollections)) {
        for (const track of tracks) {
          if (!('index' in track && 'collID' in track)) {
            continue;
          }
          trackDict[track['collID'] + ' ' + track['index']] = track;
        }
      }
    }

    if (clusterCollections != null) {
      for (const clusters of Object.values(clusterCollections)) {
        for (const cluster of clusters) {
          if (!('index' in cluster && 'collID' in cluster)) {
            continue;
          }
          clusterDict[cluster['collID'] + ' ' + cluster['index']] = cluster;
        }
      }
    }

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];
      let collID = null;
      if ('collID' in collDict) {
        collID = collDict['collID'];
      }

      if (!('collType' in collDict)) {
        continue;
      }

      if (
        !(collDict['collType'] === 'edm4hep::ReconstructedParticleCollection')
      ) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const ReconstructedParticles = [];
      const rawParticles = collDict['collection'];
      // for(... of ...) is used to extract value, for(... in ...) is used to extract index. Only applied to iterables.
      let index = 0;
      for (const rawParticle of rawParticles) {
        let energy = null;
        if ('energy' in rawParticle) {
          energy = rawParticle['energy'];
          // Thershold energy. reconstructed particles with smaller energy will be ignored
          if (energy < 0.01) {
            index++;
            continue;
          }
        }
        let charge = null;
        if ('charge' in rawParticle) {
          charge = rawParticle['charge'];
        }
        let mass = null;
        if ('mass' in rawParticle) {
          mass = rawParticle['mass'];
        }

        const momentum = { Px: null, Py: null, Pz: null };
        if ('momentum' in rawParticle) {
          momentum['Px'] = rawParticle['momentum']['x'];
          momentum['Py'] = rawParticle['momentum']['y'];
          momentum['Pz'] = rawParticle['momentum']['z'];
        }

        const associatedTracks = [];
        const associatedClusters = [];

        const ReconstructedParticle = {
          charge: charge,
          mass: mass,
          energy: energy,
          momentum: momentum,
          associatedTracks: null,
          associatedClusters: null,
          collID: collID,
          index: index,
          toString() {
            return `{charge: ${this.charge}, mass: ${this.mass}, energy: ${this.energy}
                      , momentum: {x: ${this.momentum.Px}, y: ${this.momentum.Py}, z: ${this.momentum.Pz}}, 
                       collID: ${this.collID}, index: ${this.index}}`;
          },
        };
        // Associate particles to tracks
        if ('tracks' in rawParticle && rawParticle['tracks'].length > 0) {
          for (const rawTrack of rawParticle['tracks']) {
            const trackID = rawTrack['collectionID'] + ' ' + rawTrack['index'];
            if (trackID in trackDict) {
              trackDict[trackID]['associatedParticle'] = ReconstructedParticle;
              associatedTracks.push(trackDict[trackID]);
            }
          }
        }
        // Associate particles to clusters
        if ('clusters' in rawParticle && rawParticle['clusters'].length > 0) {
          for (const rawCluster of rawParticle['clusters']) {
            const clusterID =
              rawCluster['collectionID'] + ' ' + rawCluster['index'];
            if (clusterID in clusterDict) {
              clusterDict[clusterID]['associatedParticle'] =
                ReconstructedParticle;
              associatedClusters.push(clusterDict[clusterID]);
            }
          }
        }
        ReconstructedParticle.associatedTracks = associatedTracks;
        ReconstructedParticle.associatedClusters = associatedClusters;
        ReconstructedParticles.push(ReconstructedParticle);
        index++;
      }
      ReconstructedParticleCollections[collName] = ReconstructedParticles;
    }
    // returned a dictionary, whose keys are their collection names
    return ReconstructedParticleCollections;
  }
  /*return MC Particles*/
  private getMCParticles(event: any) {
    const MCParticleCollections = {};
    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];
      let collID = null;
      if ('collID' in collDict) {
        collID = collDict['collID'];
      }

      if (!('collType' in collDict)) {
        continue;
      }

      if (!(collDict['collType'] === 'edm4hep::MCParticleCollection')) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const MCParticles = [];
      const rawParticles = collDict['collection'];
      // for(... of ...) is used to extract value, for(... in ...) is used to extract index. Only applied to iterables.
      let index = 0;
      for (const rawParticle of rawParticles) {
        let PDG = null;
        let mass = null;
        let charge = null;
        let vertex = null;
        let endpoint = null;
        let momentum = null;

        const point = {
          x: null,
          y: null,
          z: null,
          toString() {
            return `{x:${this.x}, y:${this.y}, z:${this.z}}`;
          },
        };
        if ('PDG' in rawParticle) {
          PDG = rawParticle['PDG'];
        }
        if ('mass' in rawParticle) {
          mass = rawParticle['mass'];
        }
        if ('charge' in rawParticle) {
          charge = rawParticle['charge'];
        }
        if ('vertex' in rawParticle) {
          vertex = Object.assign({}, point);
          vertex.x = rawParticle['vertex']['x'] * 0.1 * this.scale;
          vertex.y = rawParticle['vertex']['y'] * 0.1 * this.scale;
          vertex.z = rawParticle['vertex']['z'] * 0.1 * this.scale;
        }
        if ('endpoint' in rawParticle) {
          endpoint = Object.assign({}, point);
          endpoint.x = rawParticle['endpoint']['x'] * 0.1 * this.scale;
          endpoint.y = rawParticle['endpoint']['y'] * 0.1 * this.scale;
          endpoint.z = rawParticle['endpoint']['z'] * 0.1 * this.scale;
        }
        let length = 0;
        if ('momentum' in rawParticle) {
          momentum = {
            Px: null,
            Py: null,
            Pz: null,
            toString() {
              return `{x:${this.Px}, y:${this.Py}, z:${this.Pz}}`;
            },
          };
          const Px = rawParticle['momentum']['x'];
          const Py = rawParticle['momentum']['y'];
          const Pz = rawParticle['momentum']['z'];
          momentum.Px = Px;
          momentum.Py = Py;
          momentum.Pz = Pz;
          length = Math.sqrt(Px * Px + Py * Py + Pz * Pz);
        }
        let color = '#555555';
        if (charge < 0) {
          color = '#cc9955';
        }
        if (charge > 0) {
          color = '#5555cc';
        }
        const MCParticle = {
          PDG: PDG,
          Mass: mass,
          Charge: charge,
          Vertex: vertex,
          Endpoint: endpoint,
          Momentum: momentum,
          collID: collID,
          index: index,
          color: color,
          // Add information about magnetic field strength inside detector, will be useful when interpolating tracks
          magneticFieldStrength: this.magneticFieldStrength,
          size: Math.log(1 + length) * this.scale,
        };
        MCParticles.push(MCParticle);
        index++;
      }
      MCParticleCollections[collName] = MCParticles;
    }
    return MCParticleCollections;
  }

  /** Return missing energy */
  private getMissingEnergy(event: any) {
    const allMETs: any[] = [];

    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collType' in collDict)) {
        continue;
      }

      if (
        !(collDict['collType'] === 'edm4hep::ReconstructedParticleCollection')
      ) {
        continue;
      }

      if (!(collName.includes('Missing') || collName.includes('missing'))) {
        continue;
      }

      if (!('collection' in collDict)) {
        continue;
      }

      const METs: any[] = [];
      const rawMETs = collDict['collection'];
      const METColor = '#ff69b4';

      rawMETs.forEach((rawMET: any) => {
        if (!('momentum' in rawMET)) {
          return;
        }
        if (!('energy' in rawMET)) {
          return;
        }
        const px = rawMET['momentum']['x'];
        const py = rawMET['momentum']['y'];
        const pz = rawMET['momentum']['z'];

        const p = Math.sqrt(
          Math.pow(px, 2) + Math.pow(py, 2) + Math.pow(pz, 2),
        );
        const etx = (rawMET['energy'] * px) / p;
        const ety = (rawMET['energy'] * py) / p;

        const MET = {
          etx: etx * 10,
          ety: ety * 10,
          color: '#ff69b4',
        };
        METs.push(MET);
      });
      allMETs[collName] = METs;
    }

    return allMETs;
  }

  /** Return a random colour */
  private randomColor() {
    return Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase();
  }

  /** Helper conversion of HSL to hexadecimal */
  private convHSLtoHEX(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };

    return `${f(0)}${f(8)}${f(4)}`;
  }

  /** Return a lightness value from the passed number and range */
  private valToLightness(v: number, min: number, max: number): number {
    let lightness = 80 - ((v - min) * 65) / (max - min);
    if (lightness < 20) {
      lightness = 20;
    }
    if (lightness > 85) {
      lightness = 85;
    }

    return lightness;
  }

  /** Return a opacity value from the passed number and range */
  private valToOpacity(v: number, min: number, max: number): number {
    let opacity = 0.2 + ((v - min) * 0.65) / (max - min);
    if (opacity < 0.2) {
      opacity = 0.2;
    }
    if (opacity > 0.8) {
      opacity = 0.8;
    }

    return opacity;
  }

  /** Get the required collection */
  private getCollByID(event: any, id: number) {
    for (const collName in event) {
      if (event[collName].constructor != Object) {
        continue;
      }

      const collDict = event[collName];

      if (!('collID' in collDict)) {
        continue;
      }

      if (collDict['collID'] === id) {
        return collDict['collection'];
      }
    }
  }
}
