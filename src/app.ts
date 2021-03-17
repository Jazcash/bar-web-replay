import * as PIXI from "pixi.js";
import { Loader, Texture } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { DemoModel } from "sdfz-demo-parser";
import { ReplayPlayer } from "./replay-player";

interface UnitPosition {
    teamId: number;
    unitId: number;
    unitDefId: number;
    x: number;
    z: number;
}

interface DataFile {
    info: DemoModel.Info.Info;
    unitPositions: Array<{ frame: number, positions: UnitPosition[] }>;
}

(async () => {
    //const trackEl = document.getElementById("tracker");

    const mapWidth = 10 * 1024;
    const mapHeight = 6 * 1024;

    const app = new PIXI.Application({
        view: document.getElementById("replay-canvas") as HTMLCanvasElement,
        width: 600,
        height: 500
    });

    const viewport = (window as any).viewport = new Viewport({
        screenWidth: app.view.width,
        screenHeight: app.view.height,
        worldWidth: mapWidth,
        worldHeight: mapHeight,
        interaction: app.renderer.plugins.interaction
    });
    app.stage.addChild(viewport as any);
    const max = mapWidth > mapHeight ? { maxWidth: mapWidth } : { maxHeight: mapHeight };
    viewport.drag().pinch().wheel().clamp({ direction: "all" }).clampZoom({ ...max, minWidth: 100, minHeight: 100 }).fit();
    
    const loader = (window as any).loader = Loader.shared;
    
    loader.add("unitpics1", "atlases/unitpics-0.json");
    loader.add("unitpics2", "atlases/unitpics-1.json");
    loader.add("icons", "atlases/icons-0.json");
    loader.add("map", "test/texture-hq.png");
    loader.add("data-file", "test/20210307_235406_DSDR 3_104.0.1-1804-g4976884 BAR_positions.json");
    loader.add("unitdefs", "test/BYAR.json");
    loader.add("unitdeficons", "test/unitdef-icons.json");
    
    loader.onProgress.add((loader: Loader) => {
        const progressPercent = loader.progress / 100;
    });

    await load(loader);

    const unitDefs = loader.resources["unitdefs"].data as { [unitDefId: number]: string };
    const unitDefIcons = loader.resources["unitdeficons"].data as { [unitDefId: number]: string };
    const dataFile = loader.resources["data-file"].data as DataFile;

    const replayPlayer = new ReplayPlayer({
        replayInfo: dataFile.info,
        unitPositions: dataFile.unitPositions
    });

    //trackEl.setAttribute("max", `${positions.unitPositions.length}`);

    // const mapTexture = loader.resources["map"] as any;
    // const mapSprite = new PIXI.Sprite(mapTexture.texture);
    // mapSprite.width = mapWidth;
    // mapSprite.height = mapHeight;
    // viewport.addChild(mapSprite);

    // const unitPics1 = (loader.resources["unitpics1"] as any).textures as { [key: string]: Texture };
    // const unitPics2 = (loader.resources["unitpics2"] as any).textures as { [key: string]: Texture };
    // const iconsSheet = (loader.resources["icons"] as any).textures as { [key: string]: Texture };

    // const unitContainer = new PIXI.Container();
    // unitContainer.sortableChildren = true;
    // viewport.addChild(unitContainer);
    // unitContainer.alpha = 0.01;

    // const iconContainer = new PIXI.Container();
    // iconContainer.sortableChildren = true;
    // viewport.addChild(iconContainer);

    // viewport.on("zoomed", ({ viewport }) => {
    //     if (viewport.scale.x > 0.4) {
    //         unitContainer.alpha = 1;
    //         iconContainer.alpha = 0.01;
    //     } else {
    //         unitContainer.alpha = 0.01;
    //         iconContainer.alpha = 1;
    //         iconContainer.children.forEach(sprite => {
    //             sprite.scale.set(1 - viewport.scale.x);
    //         });
    //     }
    // });

    // const colors: { [teamId: number]: number } = {};
    // for (const player of positions.info.players) {
    //     const { r, g, b } = player.rgbColor;
    //     colors[player.teamId] = PIXI.utils.rgb2hex([r/255, g/255, b/255]);
    // }

    // renderGameState(positions.unitPositions[0].positions);

    // function renderGameState(unitPositions: UnitPosition[]) {
    //     for (const unitPos of unitPositions) {
    //         const unitDefKey = unitDefs[unitPos.unitDefId];
    //         const sprite = createUnitSprite(unitDefKey);
    //         sprite.x = unitPos.x;
    //         sprite.y = unitPos.z;
    //         sprite.anchor.set(0.5);
    //         sprite.scale.set(0.3);
    //         sprite.zIndex = unitPos.z;
    //         unitContainer.addChild(sprite);

    //         const iconKey = unitDefIcons[unitDefKey];
    //         const icon = new PIXI.Sprite(iconsSheet[iconKey]);
    //         icon.x = unitPos.x;
    //         icon.y = unitPos.z;
    //         icon.anchor.set(0.5);
    //         icon.scale.set(1 - viewport.scale.x);
    //         icon.zIndex = unitPos.z;
    //         icon.tint = colors[unitPos.teamId];
    //         iconContainer.addChild(icon);

    //         const debugText = new PIXI.Text(`${unitPos.unitId} - ${unitPos.unitDefId}`);
    //         debugText.x = unitPos.x;
    //         debugText.y = unitPos.z - 40;
    //         debugText.zIndex = 99999;
    //         debugText.anchor.set(0.5);
    //         unitContainer.addChild(debugText);
    //     }
    // }

    // function createUnitSprite(unitDefKey: string) : PIXI.Sprite {
    //     const texture = unitPics1[unitDefKey] ?? unitPics2[unitDefKey];
    //     return new PIXI.Sprite(texture);
    // }
})();

function load(loader: PIXI.Loader) {
    return new Promise<void>(resolve => loader.load(() => resolve()));
}