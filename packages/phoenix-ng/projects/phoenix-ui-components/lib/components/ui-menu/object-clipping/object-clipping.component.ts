import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-object-clipping',
  templateUrl: './object-clipping.component.html',
  styleUrls: ['./object-clipping.component.scss'],
})
export class ObjectClippingComponent {
  selectedClipping: 'vertical' | 'horizontal' | null = null;
  clippingEnabled: boolean;
  startClippingAngle: number;
  openingClippingAngle: number;

  constructor(private eventDisplay: EventDisplayService) {
    const stateManager = this.eventDisplay.getStateManager();
    stateManager.clippingEnabled.onUpdate(
      (clippingValue) => (this.clippingEnabled = clippingValue),
    );
    stateManager.startClippingAngle.onUpdate(
      (value) => (this.startClippingAngle = value),
    );
    stateManager.openingClippingAngle.onUpdate(
      (value) => (this.openingClippingAngle = value),
    );
  }

  changeStartClippingAngle(startingAngle: number) {
    this.eventDisplay.getUIManager().rotateStartAngleClipping(startingAngle);
  }

  changeOpeningClippingAngle(openingAngle: number) {
    this.eventDisplay.getUIManager().rotateOpeningAngleClipping(openingAngle);
  }

  toggleClipping(type: 'vertical' | 'horizontal', change: MatCheckboxChange) {
    // 'vertical' and 'horizontal' clipping should be exclusive. The following code realizes this
    if (this.selectedClipping == type) {
      this.selectedClipping = null;
      change.source.checked = false;
    } else {
      this.selectedClipping = type;
      this.eventDisplay.getThreeManager().setClipType(type);
    }

    const value = change.checked;
    this.eventDisplay.getUIManager().setClipping(value);
    this.clippingEnabled = value;
  }
}
