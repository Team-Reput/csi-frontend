import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonPageHeader } from '../../../common/cards/common-page-header/common-page-header';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, CommonPageHeader],
  templateUrl: './integrations.html'
})
export class Integrations {
  readonly items = [
    { n: 'Microsoft Dynamics SL', t: 'ERP order stream', s: 'connected', ic: '⧉', det: 'Solomon ERP · order and lot master syncs nightly.' },
    { n: 'Datacolor Spectro', t: 'LAB measurement import', s: 'connected', ic: '◉', det: 'Direct instrument feed · auto-matches to standards.' },
    { n: 'WGSN Trend API', t: 'External trend feed', s: 'connected', ic: '✦', det: 'Pulls quarterly palettes for Trend-Bridge mapping.' },
    { n: 'Brand PLM Connectors', t: 'Centric, FlexPLM, Bamboo', s: 'ready', ic: '⇪', det: 'Push approved palettes directly to customer PLM systems.' }
  ];
}
