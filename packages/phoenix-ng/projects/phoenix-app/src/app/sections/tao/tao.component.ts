import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Configuration,
  PresetView,
  PhoenixMenuNode,
} from 'phoenix-event-display';
import {
  EventDataFormat,
  EventDataImportOption,
  EventDisplayService, // 从根路径导入（匹配public_api.ts导出）
} from 'phoenix-ui-components';
// 导入PhoenixLoader（匹配你提供的PhoenixLoader.ts路径）
import { PhoenixLoader } from 'phoenix-event-display/src/loaders/phoenix-loader';

@Component({
  selector: 'app-tao',
  templateUrl: './tao.component.html',
  styleUrl: './tao.component.scss',
})
export class TaoComponent implements OnInit, OnDestroy {
  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');
  loaded = false;
  loadingProgress: number = 0;
  eventDataImportOptions: EventDataImportOption[] = [
    EventDataFormat.JSON,
    EventDataFormat.EDM4HEPJSON,
  ];

  // 存储事例键和完整数据（匹配EventDisplay基类逻辑）
  public eventKeys: string[] = [];
  private fullEventsData: any = null;
  
  // 自动播放状态
  isPlaying = false;
  currentEventIndex = 0;
  playSpeed = 1000;
  playSpeedOptions = [
    { label: '0.5s/event', value: 500 },
    { label: '1s/event', value: 1000 },
    { label: '2s/event', value: 2000 },
  ];
  private playTimer?: number;

  constructor(
    private eventDisplay: EventDisplayService, // 根路径导入的服务
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {});
    
    

    // 1. 初始化Phoenix（配置EventDataLoader为PhoenixLoader）
    const configuration: Configuration = {
      presetViews: [
        new PresetView('Left View', [0, 0, -12000], [0, 0, 0], 'left-cube'),
        new PresetView('Center View', [-500, 12000, 0], [0, 0, 0], 'top-cube'),
        new PresetView('Right View', [0, 0, 12000], [0, 0, 0], 'right-cube'),
      ],
      defaultView: [10000, 0, 10000, 0, 0, 0],
      phoenixMenuRoot: this.phoenixMenuRoot,
      magneticFieldStrength: 3,
      eventScale: 10,
      eventDataLoader: new PhoenixLoader() // 匹配你提供的PhoenixLoader类
    };
    this.eventDisplay.init(configuration);

    // 2. 加载TAO几何（参数完全匹配基类loadRootGeometry）
    const components = new Map<string, string>([
      ['detsim', ''],
      ['Rock', 'detsim > Rock'],
      ['InnerRock', 'detsim > InnerRock'],
      ['Slate', 'InnerRock > Slate'],
      ['DetBox', 'InnerRock > DetBox'],
      ['PS_Shell', 'DetBox > PS_Shell'],
      ['WTSteel', 'DetBox > WTSteel'],
      ['WTHDPE', 'DetBox > WTHDPE'],
      ['Frame', 'DetBox > Frame'],
      ['ShieldPb', 'DetBox > ShieldPb'],
      ['PU', 'DetBox > PU'],
      ['HDPE', 'DetBox > HDPE'],
      ['BHDPE', 'DetBox > BHDPE'],
      ['ACU_Tub', 'DetBox > ACU_Tub'],
      ['TopVetoTracker', 'PS_Shell > TopVetoTracker'],
      ['Tyvek_0', 'WTSteel > Tyvek_0_children'],
      ['Tyvek_1', 'WTSteel > Tyvek_1_children'],
      ['Tyvek_2', 'WTSteel > Tyvek_2_children'],
      ['SSTub', 'PU > SSTub'],
      ['LABTub', 'SSTub > LABTub'],
      ['virtual_SiPad', 'LABTub > virtual_SiPad'],
    ]);
    components.forEach(async (parentPath, componentName) => {
      let fileName = componentName;
      if (componentName.startsWith('Tyvek_')) fileName += '_children';
      await this.eventDisplay.loadRootGeometry(
        `assets/geometry/TAO/${fileName}.root`,
        'TaoGeom',
        componentName,
        parentPath,
        10,
        true,
        true
      );
    });

    // 3. 监听几何加载完成
    this.eventDisplay.getLoadingManager().addLoadListenerWithCheck(() => {
      this.loaded = true;
      this.loadingProgress = 100
    });

    // 4. 监听事例显示变化（匹配基类listenToDisplayedEventChange）
    this.eventDisplay.listenToDisplayedEventChange((displayedEvent: any) => {
      if (!this.fullEventsData && displayedEvent) {
        this.fullEventsData = { event_0: displayedEvent };
        this.eventKeys = Object.keys(this.fullEventsData);
      }
    });

    // 5. 监听多事例导入（若导入多事例文件，调用基类parsePhoenixEvents）
    this.eventDisplay.listenToLoadedEventsChange((events: string[]) => {
      this.eventKeys = events;
    });
  }

  // 加载当前事例（匹配基类方法）
  private loadCurrentEvent(): void {
    if (this.eventKeys.length === 0 || !this.fullEventsData) return;
    const currentEventKey = this.eventKeys[this.currentEventIndex];
    
    // 清除当前事例（通过ThreeManager）
    this.eventDisplay.getThreeManager().clearEventData();
    // 加载新事例（匹配基类loadEvent）
    this.eventDisplay.loadEvent(currentEventKey);
  }

  // 播放/暂停切换
  togglePlay(): void {
    if (this.eventKeys.length === 0 || !this.loaded) return;
    if (this.isPlaying) {
      clearInterval(this.playTimer!);
    } else {
      this.playTimer = window.setInterval(() => this.nextEvent(), this.playSpeed);
    }
    this.isPlaying = !this.isPlaying;
  }

  // 下一个事例（循环）
  private nextEvent(): void {
    this.currentEventIndex = 
      this.currentEventIndex >= this.eventKeys.length - 1 
        ? 0 
        : this.currentEventIndex + 1;
    this.loadCurrentEvent();
  }

  // 切换播放速度
  changePlaySpeed(newSpeed: number): void {
    this.playSpeed = newSpeed;
    if (this.isPlaying) {
      clearInterval(this.playTimer!);
      this.playTimer = window.setInterval(() => this.nextEvent(), this.playSpeed);
    }
  }

  // 组件销毁清除定时器
  ngOnDestroy(): void {
    if (this.playTimer) {
      clearInterval(this.playTimer);
    }
  }
}