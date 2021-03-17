import { Viewport } from "pixi-viewport";
import { DemoModel } from "sdfz-demo-parser";

export interface UnitPosition {
    teamId: number;
    unitId: number;
    unitDefId: number;
    x: number;
    z: number;
}

export interface ReplayParserConfig {
    replayInfo: DemoModel.Info.Info;
    unitPositions: Array<{ frame: number, positions: UnitPosition[] }>;
}

export class ReplayPlayer {
    protected replayInfo: DemoModel.Info.Info;
    protected unitPositions: Array<{ frame: number, positions: UnitPosition[] }>;

    constructor(config: ReplayParserConfig) {
        this.replayInfo = config.replayInfo;
        this.unitPositions = config.unitPositions;
    }

    public renderGameState() {

    }
}