import * as PIXI from "pixi.js";
import { Graphics, ILoaderResource, InteractionEvent, Loader, Sprite, Texture } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { DemoModel } from "sdfz-demo-parser";
import * as TWEEN from "@tweenjs/tween.js";

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
    const mapWidth = 10 * 1024;
    const mapHeight = 6 * 1024;
    let currentFrameIndex = 0;
    let tweens: TWEEN.Tween<Sprite>[] = [];
    let tickerFn: (dt: number) => void = () => {};

    const app = new PIXI.Application({
        view: document.getElementById("replay-canvas") as HTMLCanvasElement,
        width: 600,
        height: 500
    });

    app.ticker.add(() => {
        TWEEN.update();
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
    
    loader.add("unitpics", "atlases/unitpics-0.json");
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
    const dataFile = (window as any).data = loader.resources["data-file"].data as DataFile;

    const mapTexture = loader.resources["map"] as ILoaderResource;
    const mapSprite = new PIXI.Sprite(mapTexture.texture);
    mapSprite.width = mapWidth;
    mapSprite.height = mapHeight;
    viewport.addChild(mapSprite);

    const unitContainer = new PIXI.Container();
    unitContainer.sortableChildren = true;
    viewport.addChild(unitContainer);
    unitContainer.alpha = 0.01;

    const iconContainer = new PIXI.Container();
    iconContainer.sortableChildren = true;
    viewport.addChild(iconContainer);

    viewport.on("zoomed", ({ viewport }) => {
        if (viewport.scale.x > 0.3) {
            unitContainer.alpha = 1;
            iconContainer.alpha = 0.01;
        } else {
            unitContainer.alpha = 0.01;
            iconContainer.alpha = 1;
            iconContainer.children.forEach(sprite => {
                sprite.scale.set(1 - viewport.scale.x);
            });
        }
    });

    const colors: { [teamId: number]: number } = {};
    for (const player of dataFile.info.players) {
        const { r, g, b } = player.rgbColor;
        colors[player.teamId] = PIXI.utils.rgb2hex([r/255, g/255, b/255]);
    }

    const tracker = new Graphics();
    tracker.interactive = true;
    tracker.buttonMode = true;
    app.stage.addChild(tracker);
    tracker.on("pointerdown", (event: InteractionEvent) => {
        const pos = event.data.getLocalPosition(tracker);
        const percent = pos.x / tracker.width;
        const frame = Math.floor(dataFile.unitPositions.length * percent);
        renderGameState(frame);
    });

    document.addEventListener("keyup", (evt) => {
        if (evt.key === "ArrowRight") {
            renderGameState(currentFrameIndex + 1);
        } else if(evt.key === "ArrowLeft") {
            renderGameState(currentFrameIndex - 1);
        }
    });

    updateTracker();
    renderGameState(currentFrameIndex);

    async function renderGameState(frameIndex: number) {
        currentFrameIndex = frameIndex;

        app.ticker.remove(tickerFn);

        tweens.forEach(tween => {
            tween.end();
            tween.stop();
        });
        tweens = [];

        unitContainer.removeChildren();
        iconContainer.removeChildren();

        const frameUnits = dataFile.unitPositions[frameIndex];
        const nextFrameUnits = dataFile.unitPositions[frameIndex + 1];
        const frameDeltaMs = ((nextFrameUnits.frame - frameUnits.frame) / 30) * 1000;

        for (const unitPos of frameUnits.positions) {
            const nextUnitPos = nextFrameUnits.positions.find(unit => unit.unitId === unitPos.unitId);

            const unitDefKey = unitDefs[unitPos.unitDefId];
            const sprite = new PIXI.Sprite(getTexture("unitpics", unitDefKey));
            sprite.x = unitPos.x;
            sprite.y = unitPos.z;
            sprite.anchor.set(0.5);
            sprite.scale.set(0.3);
            sprite.tint = colors[unitPos.teamId];
            sprite.zIndex = unitPos.z;
            unitContainer.addChild(sprite);

            if (nextUnitPos && (unitPos.x !== nextUnitPos.x || unitPos.z !== nextUnitPos.z)) {
                const unitPicTween = new TWEEN.Tween(sprite).to({ x: nextUnitPos.x, y: nextUnitPos.z }, frameDeltaMs).start();
                tweens.push(unitPicTween);
            }

            const iconKey = unitDefIcons[unitDefKey];
            const icon = new PIXI.Sprite(getTexture("icons", iconKey));
            icon.x = unitPos.x;
            icon.y = unitPos.z;
            icon.anchor.set(0.5);
            icon.scale.set(1 - viewport.scale.x);
            icon.zIndex = unitPos.z;
            icon.tint = colors[unitPos.teamId];
            iconContainer.addChild(icon);

            if (nextUnitPos && (unitPos.x !== nextUnitPos.x || unitPos.z !== nextUnitPos.z)) {
                const iconTween = new TWEEN.Tween(icon).to({ x: nextUnitPos.x, y: nextUnitPos.z }, frameDeltaMs).start();
                tweens.push(iconTween);
            }

            const debugText = new PIXI.Text(`#${unitPos.unitId} - ${unitPos.unitDefId}`, {
                fontSize: 40
            });
            debugText.anchor.set(0.5);
            sprite.addChild(debugText);
            debugText.y = -150;
        }

        updateTracker();

        await delay(frameDeltaMs);

        renderGameState(currentFrameIndex + 1);
    }

    function updateTracker() {
        const width = app.view.width * (currentFrameIndex / dataFile.unitPositions.length);

        tracker.clear();
        tracker.beginFill(0x333333).drawRect(0, app.view.height - 20, app.view.width, 20);
        tracker.beginFill(0xff0000).drawRect(0, app.view.height - 20, width, 20);
    }

    function getTexture(sheetKey: string, frameName: string) {
        return (loader.resources[sheetKey] as ILoaderResource).textures[frameName];
    }

    function delay(delayMs: number) {
        return new Promise<void>(resolve => {
            let progress = 0;
            tickerFn = function(dt: number) {
                progress += dt;
                const elapsedMs = progress / (60 * PIXI.Ticker.shared.speed) * 1000;
                if (elapsedMs >= delayMs) {
                    resolve();
                    app.ticker.remove(tickerFn);
                }
            }
            app.ticker.add(tickerFn);
        });
    }
})();

function load(loader: PIXI.Loader) {
    return new Promise<void>(resolve => loader.load(() => resolve()));
}