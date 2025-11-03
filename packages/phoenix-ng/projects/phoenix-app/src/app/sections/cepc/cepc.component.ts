import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Configuration,
  PresetView,
  PhoenixMenuNode,
} from 'phoenix-event-display';
import {
  EventDataFormat,
  EventDataImportOption,
  EventDisplayService,
} from 'phoenix-ui-components';

@Component({
  selector: 'app-cepc',
  templateUrl: './cepc.component.html',
  styleUrl: './cepc.component.scss',
})
export class CepcComponent implements OnInit {
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode(
    'Phoenix Menu',
    'phoenix-menu',
  );
  loaded = false;
  loadingProgress = 0;
  option: string = 'TDR_o1_v01';
  loadIndividual = false;

  eventDataImportOptions: EventDataImportOption[] = [
    EventDataFormat.JSON,
    EventDataFormat.EDM4HEPJSON,
  ];

  constructor(
    private eventDisplay: EventDisplayService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.option = params['option'];
    });

    const configuration: Configuration = {
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], [0, 0, 0], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], [0, 0, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], [0, 0, 0], 'right-cube'),
      ],
      defaultView: [10000, 0, 10000, 0, 0, 0],
      phoenixMenuRoot: this.phoenixMenuRoot,
      // The magnetic field strength from design report is 3T
      magneticFieldStrength: 3,
      eventScale: 10,
      maxNumNodes: 2000,
      maxNumFaces: 200000,
    };

    this.eventDisplay.init(configuration);

    if (this.option == 'TDR_o1_v01') {
      const components = new Map<string, string>([
        ['BeamPipe', 'BeamPipe'],
        ['VXD', 'VXD'],
        ['ITK_Barrel', 'ITK > Barrel'],
        ['ITK_Endcap', 'ITK > Endcap'],
        ['TPC', 'TPC'],
        ['OTK_Barrel', 'OTK > Barrel'],
        ['OTK_Endcap', 'OTK > Endcap'],
        ['ECAL_Barrel', 'ECAL > Barrel'],
        ['ECAL_Endcap', 'ECAL > Endcap'],
        ['HCAL_Barrel', 'HCAL > Barrel'],
        ['HCAL_Endcap', 'HCAL > Endcap'],
        ['Lumical', 'Lumical'],
        ['coil', 'coil'],
        ['Muon_Barrel', 'MUON > Barrel'],
        ['Muon_Endcap', 'MUON > Endcap'],
      ]);
      components.forEach((value, key) => {
        this.eventDisplay.loadRootGeometry(
          `assets/geometry/CEPC/${this.option}_${key}.root`,
          'Default',
          key,
          value,
          // cm->mm
          10,
          // Render both sides of the geometry
          true,
        );
      });
    }
    if (this.option == 'TDR_o1_v02') {
      this.eventDisplay.loadRootGeometry(
        `assets/geometry/CEPC/${this.option}.root`,
        'Default',
        `CEPC Detector ${this.option}`,
        null,
        10,
        true,
      );
    }
    if (this.option == 'CEPC_v4') {
      const components = new Map<string, string>([
        ['ECAL', 'ECAL'],
        ['HCAL', 'HCAL'],
        ['Tracker', 'Tracker'],
        ['MUD', 'MUD'],
        ['coil', 'coil'],
      ]);
      components.forEach((value, key) => {
        this.eventDisplay.loadRootGeometry(
          `assets/geometry/CEPC/${this.option}_${key}.root`,
          'Default',
          key,
          value,
          // cm->mm
          10,
          // Render both sides of the geometry
          true,
        );
      });
    }

    this.eventDisplay
      .getLoadingManager()
      .addProgressListener((progress) => (this.loadingProgress = progress));

    this.eventDisplay
      .getLoadingManager()
      .addLoadListenerWithCheck(() => (this.loaded = true));
  }
}
