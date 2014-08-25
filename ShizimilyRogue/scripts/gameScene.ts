
module ShizimilyRogue.View {
    /** セルのWidth */
    var OBJECT_WIDTH = 64;
    /** セルのHeight */
    var OBJECT_HEIGHT = 64;

    /** メニュータイプ */
    export enum MenuType { Main, Item, Use }

    /**
     * ゲーム画面用データ
     */
    export class GameSceneData {
        /**
         * @constructor
         */
        constructor(
            public player: Common.IUnit,
            public width: number,
            public height: number,
            public objects: Common.IObject[],
            public getTable: (x: number, y: number) => Common.ICell) {
        }
    }

    /**
     * ゲーム画面
     */
    export class GameScene extends Scene {
        private message: Message;
        private menuGroup: enchant.Group;
        private pathShadow: Shadow;
        private playerHp: PlayerHp;
        private clock: Clock;
        private actualFps: ActualFPS;
        private miniMap: MiniMap;
        private view: View;
        private focus: Common.GameSceneFocus;

        /**
         * @constructor
         * @param {GameSceneData} data ゲームシーン用データ
         * @param {Common.IFOVData} fov 視界情報
         */
        constructor(private data: GameSceneData, fov: Common.IFOVData) {
            super();

            this.message = new Message();
            this.pathShadow = GameScene.getPathShadow();
            this.view = new View(data, fov);
            this.playerHp = new PlayerHp();
            this.clock = new Clock();
            this.menuGroup = new enchant.Group();
            this.miniMap = new MiniMap(fov.width, fov.height);
            this.actualFps = new ActualFPS();
            this.focus = Common.GameSceneFocus.Field;
            
            this.addChild(this.view);
            this.addChild(this.pathShadow);
            this.addChild(this.playerHp);
            this.addChild(this.clock);
            this.addChild(this.message);
            this.addChild(this.miniMap);
            this.addChild(this.menuGroup);
            this.addChild(this.actualFps);

            this.addMenuKeyHandler();
        }

        /**
         * メニューの表示
         * @param {MenuType} type ゲームシーン用データ
         * @param {string[]} data メニューアイテム
         * @param {(n: number) => void} selectHandler メニュー選択時のハンドラ
         * @param {boolean} multiple 複数選択(Default:false)
         */
        showMenu(type: MenuType, data: string[], selectHandler: (n: number) => void, multiple: boolean = false): void {
            //Scene.keyLock = true;
            this.focus = Common.GameSceneFocus.Menu;
            if (type == MenuType.Main) {
                var menu = Menu.Main(data, selectHandler, multiple);
                this.menuGroup.addChild(menu);
            } else if (type == MenuType.Item) {
                var menu = Menu.Item(data, selectHandler, multiple);
                this.menuGroup.addChild(menu);
            } else if (type == MenuType.Use) {
                var menu = Menu.Use(data, selectHandler, multiple);
                this.menuGroup.addChild(menu);
            }
        }

        /**
         * メニューを閉じる
         */
        closeMenu(): void {
            while (true) {
                this.menuGroup.removeChild(this.menuGroup.lastChild);
                if (this.menuGroup.childNodes.length == 0) {
                    break;
                }
            }
            this.tl.delay(Common.Config.KEY_LOCK_RELEASE).then(() => Scene.keyLock = false);
            this.focus = Common.GameSceneFocus.Field;
        }

        /**
         * アクションごとのアップデート
         * @param {Common.IFOVData} fov 視界情報
         * @param {Common.Action} action アクション
         * @param {number} speed スピード
         */
        updateAction(fov: Common.IFOVData, action: Common.Action, speed: number): void {
            var player = this.data.player;
            // 視界の表示
            this.pathShadow.visible = fov.getCell(player.cell.coord).isPath();

            this.playerHp.show(player.hp, player.maxHp, player.stomach);
            this.view.updateAction(fov, action, speed);
            this.miniMap.update(fov);
            this.clock.show(player.turn);
            this.message.show(action, speed);
        }

        /**
         * フレームごとのアップデート
         * @param {Common.IFOVData} fov 視界情報
         * @param {number} speed スピード
         */
        updateFrame(speed: number): void {
            Scene.ASSETS.BGM_MAIN.DATA.play();
            this.view.updateFrame(speed);
            this.actualFps.update();
        }

        /*private addMenuKeyHandler(): void {
            Scene.game.addEventListener(enchant.Event.UP_BUTTON_UP, event => {
                if (this.menuGroup.childNodes.length > 0) {
                    var menu = <Menu>this.menuGroup.lastChild;
                    menu.up();
                }
            });
            Scene.game.addEventListener(enchant.Event.DOWN_BUTTON_UP, event => {
                if (this.menuGroup.childNodes.length > 0) {
                    var menu = <Menu>this.menuGroup.lastChild;
                    menu.down();
                }
            });
            Scene.game.addEventListener(enchant.Event.A_BUTTON_DOWN, event => {
                if (this.menuGroup.childNodes.length > 0) {
                    var menu = <Menu>this.menuGroup.lastChild;
                    menu.select();
                }
            });
            Scene.game.addEventListener(enchant.Event.B_BUTTON_DOWN, event => {
                if (this.menuGroup.childNodes.length > 0) {
                    this.menuGroup.removeChild(this.menuGroup.lastChild);
                    if (this.menuGroup.childNodes.length == 0)
                        this.tl.delay(Common.Config.KEY_LOCK_RELEASE).then(() => Scene.keyLock = false);
                }
            });
        }*/

        /**
         * フォーカスがフィールドにあればTrue
         */
        public hasFieldFocus(): boolean {
            return this.focus == Common.GameSceneFocus.Field;
        }

        private addMenuKeyHandler(): void {
            Scene.game.addEventListener(enchant.Event.ENTER_FRAME, (e) => {
                if (Input.BtnUp.count == 1 && this.focus == Common.GameSceneFocus.Menu) {
                    if (this.menuGroup.childNodes.length > 0) {
                        var menu = <Menu>this.menuGroup.lastChild;
                        menu.up();
                    }
                }
                if (Input.BtnDown.count == 1) {
                    if (this.menuGroup.childNodes.length > 0) {
                        var menu = <Menu>this.menuGroup.lastChild;
                        menu.down();
                    }
                }
                if (Input.BtnA.count == 1) {
                    if (this.menuGroup.childNodes.length > 0) {
                        var menu = <Menu>this.menuGroup.lastChild;
                        menu.select();
                    }
                }
                if (Input.BtnB.count == 1) {
                    if (this.menuGroup.childNodes.length > 0) {
                        this.menuGroup.removeChild(this.menuGroup.lastChild);
                        if (this.menuGroup.childNodes.length == 0) {
                            this.tl.delay(Common.Config.KEY_LOCK_RELEASE).then(() => Scene.keyLock = false);
                            this.focus = Common.GameSceneFocus.Field;
                        }
                    }
                }
            });
        }

        private static getPathShadow() {
            var map: Common.Coord[] = [];

            var x = Math.floor(VIEW_WIDTH / OBJECT_WIDTH / 2);
            var y = Math.floor(VIEW_HEIGHT / OBJECT_HEIGHT / 2) + 1;
            map.push(new Common.Coord(x + 1, y - 1));
            map.push(new Common.Coord(x + 1, y));
            map.push(new Common.Coord(x + 1, y + 1));
            map.push(new Common.Coord(x, y - 1));
            map.push(new Common.Coord(x, y));
            map.push(new Common.Coord(x, y + 1));
            map.push(new Common.Coord(x - 1, y - 1));
            map.push(new Common.Coord(x - 1, y));
            map.push(new Common.Coord(x - 1, y + 1));
            var pathShadow = new Shadow(VIEW_WIDTH / OBJECT_WIDTH + 2, VIEW_HEIGHT / OBJECT_HEIGHT + 2);

            pathShadow.x = 0;
            pathShadow.y = - OBJECT_HEIGHT / 3;

            pathShadow.update(map);
            return pathShadow;
        }
    }

    /**
     * ミニマップ
     */
    class MiniMap extends enchant.Group {
        private static BLOCK_UNIT = 16;
        private static BLOCK_PLAYER = 19;
        private static BLOCK_EXIT = 20;
        private static BLOCK_ITEM = 18;
        private static BLOCK_OHTER = 15;
        private static X = 200;
        private static Y = 100;
        private static ALPHA = 0.7;
        private static SIZE = 8;
        private static FLOOR_TABLE = [6, 5, 11, 10, 7, 4, 12, 13, 1, 0, 3, 8, 2, 15, 9]; 

        private groundMap: enchant.Map = new enchant.Map(MiniMap.SIZE, MiniMap.SIZE);
        private floorMap: enchant.Map = new enchant.Map(MiniMap.SIZE, MiniMap.SIZE);
        private floorData: number[][];
        private groundData: number[][];

        /**
         * ミニマップのコンストラクタ
         * @param {number} w Width
         * @param {number} h Height
         * @constructor
         */
        constructor(private w:number, private h:number) {
            super();
            this.floorData = new Array<number[]>(h);
            this.groundData = new Array<number[]>(h);
            for (var y = 0; y < h; y++) {
                this.floorData[y] = new Array<number>(w);
                this.groundData[y] = new Array<number>(w);
                for (var x = 0; x < w; x++) {
                    this.floorData[y][x] = MiniMap.BLOCK_OHTER;
                    this.groundData[y][x] = MiniMap.BLOCK_OHTER;
                }
            }
            this.x = MiniMap.X;
            this.y = MiniMap.Y;
            this.groundMap.image = Scene.ASSETS.MINI_MAP.DATA;
            this.floorMap.image = Scene.ASSETS.MINI_MAP.DATA;
            this.groundMap.opacity = MiniMap.ALPHA;
            this.floorMap.opacity = MiniMap.ALPHA;
            this.addChild(this.floorMap);
            this.addChild(this.groundMap);
        }

        /**
         * ミニマップのアップデート
         * @param {Common.IFOVData} fov 視界情報
         */
        update(fov: Common.IFOVData): void {
            for (var y = 0; y < this.h; y++) {
                for (var x = 0; x < this.w; x++) {
                    this.groundData[y][x] = MiniMap.BLOCK_OHTER;
                }
            }

            fov.area.forEach(coord => {
                var obj = fov.getCell(coord);
                if (obj.isPlayer()) {
                    this.groundData[coord.y][coord.x] = MiniMap.BLOCK_PLAYER;
                } else if (obj.isUnit()) {
                    this.groundData[coord.y][coord.x] = MiniMap.BLOCK_UNIT;
                } else if (obj.isItem()) {
                    this.groundData[coord.y][coord.x] = MiniMap.BLOCK_ITEM;
                } else if (obj.isExit()) {
                    this.groundData[coord.y][coord.x] = MiniMap.BLOCK_EXIT;
                }
                if (!obj.isWall()) {
                    var x = coord.x;
                    var y = coord.y;

                    var p = 0;
                    p |= fov.getCellByCoord(x - 1, y).isWall() ? (1 << 0) : 0;
                    p |= fov.getCellByCoord(x, y + 1).isWall() ? (1 << 1) : 0;
                    p |= fov.getCellByCoord(x + 1, y).isWall() ? (1 << 2) : 0;
                    p |= fov.getCellByCoord(x, y - 1).isWall() ? (1 << 3) : 0;
                    this.floorData[coord.y][coord.x] = MiniMap.FLOOR_TABLE[p];
                }
            });
            this.floorMap.loadData(this.floorData);
            this.groundMap.loadData(this.groundData);
        }
    }

    /**
     * 下部のメッセージ
     */
    class Message extends enchant.Group {
        private static MESSAGE_TOP = 408;
        private static MESSAGE_LEFT = 20;
        private static MESSAGE_WIDTH = VIEW_WIDTH - Message.MESSAGE_LEFT;
        private static MESSAGE_HEIGHT = 20;
        private static MESSAGE_AREA_OPACITY = 0.8;
        private static MESSAGE_LINE = 3;

        private messageArea: enchant.Sprite;
        private messageGroup: enchant.Group;
        private icon: enchant.Sprite;
        private messages: string[] = [];
        private groupTl: enchant.Timeline = null;
        private count: number = 0;

        /**
         * @constructor
         */
        constructor() {
            super();
            this.messageArea = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            this.messageArea.image = Scene.ASSETS.MESSAGE_WINDOW.DATA;
            this.messageArea.opacity = Message.MESSAGE_AREA_OPACITY;
            this.icon = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            this.icon.image = Scene.ASSETS.MESSAGE_ICON.DATA;

            this.messageGroup = new enchant.Group();
            this.messageGroup.x = Message.MESSAGE_LEFT;
            this.messageGroup.y = Message.MESSAGE_TOP;

            this.addChild(this.messageArea);
            this.addChild(this.icon);
            this.addChild(this.messageGroup);

            this.visible = false;
        }

        /**
         * メッセージの表示
         * @param {Common.Action} action メッセージを表示するアクション
         * @param {number} speed スピード
         */
        show(action: Common.Action, speed: number): void {
            var m = Data.Message[action.type];
            if (m != null) {
                this.visible = true;
                if (this.groupTl == null) {
                    this.resetMessageGroup();
                }

                var str = m(action);
                this.messages.push(str);
                this.setMessage(speed);
            }
        }

        /**
         * 表示の切替
         * @param {boolean} flg True/False
         */
        set visible(flg: boolean) {
            this.messageArea.visible = flg;
            this.icon.visible = flg;

            if (!flg) {
                this.removeChild(this.messageGroup);
                this.groupTl = null;
            }
        }

        private resetMessageGroup(): void {
            this.removeChild(this.messageGroup);
            this.messageGroup = new enchant.Group();
            this.messageGroup.x = Message.MESSAGE_LEFT;
            this.messageGroup.y = Message.MESSAGE_TOP;
            this.addChild(this.messageGroup);
            this.groupTl = this.messageGroup.tl;
        }

        private setMessage(speed: number): void {

            var upSpeed = speed * Common.Config.MESSAGE_SPEED;
            if (this.messages.length > 0) {

                var label = new enchant.Label();
                label = new enchant.Label();
                label.font = "16px cursive";
                label.color = "white";
                label.width = Message.MESSAGE_WIDTH;
                label.text = this.messages.shift();
                label.visible = false;
                label.y = this.messageGroup.lastChild == null ? 0 : this.messageGroup.lastChild.y + Message.MESSAGE_HEIGHT;
                this.messageGroup.addChild(label);

                if (this.messageGroup.childNodes.length > Message.MESSAGE_LINE) {
                    this.groupTl = this.groupTl.delay(upSpeed).then(() => {
                        this.messageGroup.removeChild(this.messageGroup.firstChild);
                    }).moveBy(0, -Message.MESSAGE_HEIGHT, upSpeed).then((e) => {
                        this.messageGroup.childNodes[Message.MESSAGE_LINE - 1].visible = true;
                        this.count++;
                        this.tl.delay(speed * Common.Config.MESSAGE_FADEOUT).then(() => {
                            this.count--;
                            if (this.count == 0) {
                                this.visible = false;
                            }
                        });
                    }).delay(upSpeed).then(() => {
                        this.setMessage(speed);
                    });
                } else {
                    label.visible = true;
                    this.count++;
                    this.setMessage(speed);
                    this.tl.delay(speed * Common.Config.MESSAGE_FADEOUT).then(() => {
                        this.count--;
                        if (this.count == 0) {
                            this.visible = false;
                        }
                    });
                }
            }
        }
    }

    class PlayerHp extends enchant.Group {
        private static PLAYERHP_TOP = 10;
        private static PLAYERHP_LEFT = 255;
        //private static PLAYERHP_WIDTH = VIEW_WIDTH - PlayerHp.PLAYERHP_LEFT;
        //private static PLAYERHP_HEIGHT = 100;

        private hpText: enchant.Label;

        constructor() {
            super();
            this.hpText = new enchant.Label();
            this.hpText.x = PlayerHp.PLAYERHP_LEFT;
            this.hpText.y = PlayerHp.PLAYERHP_TOP;
            this.hpText.font = "24px cursive";
            this.hpText.color = "red";

            //this.hpText.width = PlayerHp.PLAYERHP_WIDTH;
            //this.hpText.height = PlayerHp.PLAYERHP_HEIGHT;

            this.addChild(this.hpText);
        }

        show(hp: number, maxHp: number, stomach: number): void {
            this.hpText.text = hp + " / " + maxHp + " (" + stomach + ")";
        }

        set visible(flg: boolean) {
            this.hpText.visible = flg;
        }
    }

    /**
     * 時計
     */
    class Clock extends enchant.Group {
        private static CLOCK_TOP = 10;
        private static CLOCK_LEFT = 550;

        private clockText: enchant.Label;

        constructor() {
            super();
            this.clockText = new enchant.Label();
            this.clockText.x = Clock.CLOCK_LEFT;
            this.clockText.y = Clock.CLOCK_TOP;
            this.clockText.font = "24px cursive";
            this.clockText.color = "red";

            this.addChild(this.clockText);
        }

        show(turn: number): void {
            var second = turn % 60;
            var hour = (turn - second) / 60 + 17;
            this.clockText.text = hour + " : " + (second < 10 ? "0" + String(second) : String(second));
        }

        set visible(flg: boolean) {
            this.clockText.visible = flg;
        }
    }

    /**
     * FPS表示
     */
    class ActualFPS extends enchant.Group {
        private static FPSDISP_TOP = 460;
        private static FPSDISP_LEFT = 570;
        private static LAP = 1000;
        private fpsText: enchant.Label;
        
        private lastTime: number;
        private elapsedFrame: number = 0;

        constructor() {
            super();
            this.fpsText = new enchant.Label();
            this.fpsText.x = ActualFPS.FPSDISP_LEFT;
            this.fpsText.y = ActualFPS.FPSDISP_TOP;
            this.fpsText.font = "16px cursive";
            this.fpsText.color = "#00ff00";

            this.addChild(this.fpsText);

            this.lastTime = this.time;
        }

        update(): void {
            this.elapsedFrame++;
            var time = this.time;
            if (time - this.lastTime > ActualFPS.LAP) {
                this.fpsText.text = "fps " + (this.elapsedFrame * 1000 / (time - this.lastTime)).toFixed(3);
                this.lastTime = time;
                this.elapsedFrame = 0;
            }
        }

        private get time(): number {
            var date = new Date();
            return date.getTime();
        }

        set visible(flg: boolean) {
            this.fpsText.visible = flg;
        }
    }

    /** ゲーム画面本体 */
    class View extends enchant.Group {
        private objects: { [id: number]: ViewObject } = {};

        private roomShadow: Shadow;
        private floorMap: Map;
        private groundMap: Map;
        private layer: enchant.Group[];
        private lastCoord: Common.Coord;
        private lastFov:Common.IFOVData = null;

        /**
         * @constructor
         */
        constructor(private data: GameSceneData, fov: Common.IFOVData) {
            super();
            this.roomShadow = new Shadow(data.width, data.height);
            this.floorMap = Map.floor(data.width, data.height, data.getTable); 
            this.groundMap = Map.ground(data.width, data.height, data.getTable); 
            this.layer = new Array<enchant.Group>(Common.Layer.MAX);


            this.addChild(this.floorMap);
            this.addChild(this.groundMap);
            for (var i = Common.Layer.Ground; i < Common.Layer.MAX; i++) {
                this.layer[i] = new enchant.Group();
                this.addChild(this.layer[i]);
            }
            this.addChild(this.roomShadow);
        }

        /**
         * Actionが来るごとにUpdate
         * @param {Common.IFOVData} fov 視界情報
         * @param {Common.Action} action アクション
         * @param {number} speed 速度
         */
        updateAction(fov: Common.IFOVData, action: Common.Action, speed: number): void {
            this.updateShadow(fov);
            this.updateObjects(fov, action, speed);
            this.moveCamera(speed);
            this.lastFov = fov;
        }

        /**
         * フレームごとにUpdate
         * @param {number} speed 速度
         */
        updateFrame(speed: number): void {
            if (this.lastFov != null) {
                this.updateVisible(this.lastFov, speed);
                this.lastFov = null;
            }
            for (var id in this.objects) {
                if (this.objects[id] instanceof ViewObject) {
                    this.objects[id].updateFrame();
                }
            }
        }

        /**
         * ユニットの見える見えないのアップデート
         * @param {Common.IFOVData} fov 視界情報
         * @param {number} speed 速度
         */
        private updateVisible(fov: Common.IFOVData, speed: number) {
            for (var id in this.objects) {
                if (fov.isVisible(id)) {
                    this.objects[id].show(speed);
                } else {
                    this.objects[id].hide(speed);
                }
            }
        }

        private updateObjects(fov: Common.IFOVData, action: Common.Action, speed: number): void {
            // ユニットに行動を起こさせる
            if (action.isSystem()) {
                var target = action.targets[0];
                if (action.isMove()) {
                    this.objects[action.sender.id].move(action.sender.cell.coord, speed);
                } else if (action.isDrop()) {
                    if (this.objects[target.id] == null) {
                        var u = ViewObjectFactory.getInstance(target);
                        this.objects[u.id] = u;
                        this.layer[u.layer].addChild(u);

                        if (fov.isVisible(u.id)) {
                            u.show(speed);
                        }
                    }
                } else if (action.isDelete()) {
                    var u = this.objects[target.id];
                    u.hide(speed).then(() => {
                        this.layer[u.layer].removeChild(u);
                    });
                    delete this.objects[target.id];
                }
            }

            if (action.isFly()) {
                var u = ViewObjectFactory.getInstance(action.sender);
                u.move(action.coord, 0);
                u.show(0);
                this.layer[u.layer].addChild(u);
                u.move(action.targets[0].cell.coord, speed).then(() => {
                    this.layer[u.layer].removeChild(u);
                });
            }

            if (action.sender != null && this.objects[action.sender.id] != null) {
                this.objects[action.sender.id].updateAction(action, speed);
            }

            //if (this.objects[action.target.id] != null) {
            //    this.objects[action.target.id].receive(action, speed);
            //}

            for (var id in this.objects) {
                if (this.objects[id] instanceof ViewObject) {
                    this.objects[id].updateFrame();
                }
            }
        }

        // 視点移動
        private moveCamera(speed: number): void {
            var coord = this.data.objects[Common.PLAYER_ID].cell.coord;
            if (this.lastCoord != coord) {
                var x = VIEW_WIDTH / 2 - coord.x * OBJECT_WIDTH;
                var y = VIEW_HEIGHT / 2 - coord.y * OBJECT_HEIGHT;
                Scene.addAnimating();
                this.tl.moveTo(x, y, speed).then(function () {
                    Scene.decAnimating();
                });
                this.lastCoord = coord;
            }
        }

        // 部屋にいる時の影
        private updateShadow(fov: Common.IFOVData): void {
            var objs = fov.getCell(fov.me.cell.coord);
            if (fov.getCell(fov.me.cell.coord).isRoom()) {
                this.roomShadow.visible = true;
                this.roomShadow.update(fov.area);
            } else {
                this.roomShadow.visible = false;
            }
        }
    }
    

    /**
     * メニュー
     */
    class Menu extends enchant.Group {
        private static BACKGROUND_TILE_WIDTH = 64;
        private static BACKGROUND_TILE_HEIGHT = 64;
        private static BAKCGROUND_TILE = [4, 3, 5, 1, 0, 2, 7, 6, 8];
        private static TOP_MARGIN = 36;
        private static LEFT_MARGIN = 36;
        private static LINE_SIZE = 36;
        private menuArea: enchant.Map;
        private elements: enchant.Group = null;
        private cursor: enchant.Sprite;
        private cursorIndex: number = 0;
        private size = 3;

        /**
         * メインメニュー
         * @param {string[]} data メニューのアイテムリスト
         * @param {(n: number) => void} selectHandler 選択時のハンドラ
         * @param {boolean} multiple 複数選択か否か(Default:false)
         * @return {Menu} メニュー
         */
        static Main(data: string[], selectHandler: (n: number) => void, multiple: boolean = false): Menu {
            return new Menu(data, selectHandler, multiple, Scene.ASSETS.MENU_WINDOW.DATA, 10, 10, 5, 3);
        }

        /**
         * アイテムメニュー
         * @param {string[]} data メニューのアイテムリスト
         * @param {(n: number) => void} selectHandler 選択時のハンドラ
         * @param {boolean} multiple 複数選択か否か(Default:false)
         * @return {Menu} メニュー
         */
        static Item(data: string[], selectHandler: (n: number) => void, multiple: boolean = false): Menu {
            return new Menu(data, selectHandler, multiple, Scene.ASSETS.MENU_WINDOW.DATA, 10, 10, 5, 7);
        }

        /**
         * アイテムの使用メニュー
         * @param {string[]} data メニューのアイテムリスト
         * @param {(n: number) => void} selectHandler 選択時のハンドラ
         * @param {boolean} multiple 複数選択か否か(Default:false)
         * @return {Menu} メニュー
         */
        static Use(data: string[], selectHandler: (n: number) => void, multiple: boolean = false): Menu {
            return new Menu(data, selectHandler, multiple, Scene.ASSETS.MENU_WINDOW.DATA, 400, 10, 4,4);
        }

        /**
         * @constructor
         */
        constructor(
            data: string[],
            private selectHandler: (n: number) => void,
            private multiple: boolean,
            background: enchant.Surface,
            left: number, top: number,
            width: number, height: number) {
            super();
            this.menuArea = Menu.getBackground(width, height, background);
            this.menuArea.image = background;

            var imgCursor = Scene.ASSETS.MENU_CURSOR.DATA;
            this.cursor = new enchant.Sprite(imgCursor.width, imgCursor.height);
            this.cursor.image = imgCursor;

            this.cursor.x = Menu.LEFT_MARGIN;
            this.x = left;
            this.y = top;

            this.addChild(this.menuArea);
            this.setMenuElement(data);
            this.addChild(this.cursor);
            this.show();
        }

        /**
         * カーソルを上へ
         */
        public up(): void {
            if (this.cursorIndex > 0)
                this.cursorIndex--;
            this.show();
        }

        /**
         * カーソルを下へ
         */
        public down(): void {
            if (this.cursorIndex < this.elements.childNodes.length - 1)
                this.cursorIndex++;
            this.show();
        }

        /**
         * 選択
         */
        public select(): void {
            if (this.cursor.visible)
                this.selectHandler(this.cursorIndex);
        }

        private setMenuElement(data: string[]): void {
            var count = 0;
            if (this.elements != null) {
                this.removeChild(this.elements);
            }
            this.elements = new enchant.Group();
            data.forEach(d => {
                var label: enchant.Label = new enchant.Label();
                label.text = d;
                label.height = Menu.LINE_SIZE;
                label.font = "32px cursive";
                label.color = "white";
                label.y = (count % this.size) * Menu.LINE_SIZE + Menu.TOP_MARGIN;
                label.x = Menu.LEFT_MARGIN + Scene.ASSETS.MENU_CURSOR.DATA.width;
                this.elements.addChild(label);
                count++;
            });
            this.cursor.visible = data.length > 0;
            this.addChild(this.elements);
        }

        private show(): void {
            var page = Math.floor(this.cursorIndex / this.size);
            for (var i = 0; i < this.elements.childNodes.length; i++) {
                this.elements.childNodes[i].visible = i >= page * this.size && i < (page + 1) * this.size;
            }
            this.cursor.y = (this.cursorIndex % this.size) * Menu.LINE_SIZE + Menu.TOP_MARGIN;
        }

        private static getBackground(width: number, height: number, image: enchant.Surface): enchant.Map {
            var map: enchant.Map = new enchant.Map(Menu.BACKGROUND_TILE_WIDTH, Menu.BACKGROUND_TILE_HEIGHT);
            map.image = image;
            var table: number[][] = new Array<number[]>(height);

            for (var y = 0; y < height; y++) {
                table[y] = new Array<number>(width);
                for (var x = 0; x < width; x++) {
                    var e = 0;
                    if (x == 0) e += 1;
                    if (x == width - 1) e += 2;
                    if (y == 0) e += 3;
                    if (y == height - 1) e += 6;
                    table[y][x] = Menu.BAKCGROUND_TILE[e];
                }
            }
            map.loadData(table);
            return map;
        }
    }

    /**
     * 部屋内にいる時の視界外の影
     */
    class Shadow extends enchant.Map {
        /**
         * @constructor
         */
        constructor(
            private w: number,
            private h: number) {
            super(OBJECT_WIDTH, OBJECT_HEIGHT);
            this.image = Scene.ASSETS.SHADOW.DATA;
        }

        /**
         * フレームごとにUpdate
         * @param {Common.Coord[]} area 全視界の座標
         */
        public update(area: Common.Coord[]): void {
            var map:number[][] = [];
            for (var y = 0; y < this.h; y++) {
                map.push(new Array<number>(this.w));
                for (var x = 0; x < this.w; x++) {
                    map[y][x] = 0;
                }
            }
            area.forEach(a => { map[a.y][a.x] = 1; });
            this.loadData(map);
        }
    }

    /**
     * マップ上のオブジェクトのFactory
     */
    class ViewObjectFactory {
        /**
         * オブジェクトの取得
         * @param {Common.IObject} object オブジェクト
         * @return {enchant.Timeline} View用のオブジェクト
         */
        static getInstance(object: Common.IObject): ViewObject {
            if (object.isPlayer())
                return ViewObjectFactory.getPlayerInstance(<Common.IUnit>object);
            else if (object.isUnit())
                return ViewObjectFactory.getUnitInstance(<Common.IUnit>object);
            else if (object.isItem())
                return ViewObjectFactory.getItemInstance(object);
            else if (object.isStairs())
                return ViewObjectFactory.getStairsInstance(object);
            else
                return ViewObjectFactory.getObjectInstance(object);
        }

        private static getPlayerInstance(obj: Common.IUnit): ViewObject {
            var lastDir = obj.dir;
            var frameLock = false;
            var frameNum = 0;
            var idleAnimation = (sprite: enchant.Sprite) => {
                if (obj.isNormal()) {
                    var delay: number = 7;  /* 1枚の画像を表示し続けるフレーム数 */
                    var x: number[][] = [
                        [0, 1, 2, 3],
                        [0, 1, 2, 3],
                        [0, 1, 2, 3],
                        [0, 1, 2, 3],
                        [0, 1, 2, 3],
                        [8, 9, 10, 11],
                        [4, 5, 6, 7],
                        [0, 1, 2, 3]
                    ];
                    /*var allFrame: number[][];
                    for (var dir = 0; dir < 8; dir++) {
                        for (var flameNum = 0; flameNum < x[dir].length; flameNum++) {
                            for (var i = 0; i < delay; i++) {
                                allFrame[dir].push(x[dir][flameNum]);
                            }
                        }
                    }*/
                    sprite.frame = x[obj.dir][frameNum];
                    if (Scene.game.frame % delay == 0) frameNum++;
                    if (frameNum >= x[obj.dir].length) frameNum = 0;
                }
            };

            var actionAnimation = (sprite: enchant.Sprite, action: Common.Action, speed: number) => {
                if (action.isAttack()) {
                    sprite.tl
                        .moveBy(20, 0, 3).moveBy(-20, 0, 3);
                } else if (action.isStatus() && action.subType == Common.StatusActionType.Damage) {
                    var x: number[][] = [
                        [12],
                        [13, null],
                        [13, null],
                        [13, null],
                        [12, null],
                        [13, null],
                        [13, null],
                        [13, null],
                    ];
                    sprite.frame = x[obj.dir];
                    sprite.tl
                        .moveBy(20, 0, 3).moveBy(-20, 0, 3)
                        .delay(5);
                }
            };
            return new ViewObject(obj, Scene.ASSETS.SHIZIMILY.DATA, idleAnimation, actionAnimation, -0.5, -1, 128, 96);
        }

        private static getUnitInstance(obj: Common.IObject): ViewObject {
            return new ViewObject(obj, Scene.ASSETS.UNIT.DATA, (sprite) => sprite.frame = 1, () => { }, 0, -0.5);
        }

        private static getStairsInstance(obj: Common.IObject): ViewObject {
            return new ViewObject(obj, Scene.ASSETS.STAIRS.DATA, (sprite) => { sprite.frame = 0 }, () => { });
        }

        private static getObjectInstance(obj: Common.IObject): ViewObject {
            return new ViewObject(obj, Scene.ASSETS.SWEET.DATA, (sprite) => { sprite.frame = obj.category }, () => { });
        }

        private static getItemInstance(obj: Common.IObject): ViewObject {
            var image: enchant.Surface;
            switch (obj.category) {
                case Common.ItemType.Case:
                    image = Scene.ASSETS.PC_CASE.DATA;
                    break;
                case Common.ItemType.CPU:
                    image = Scene.ASSETS.CPU.DATA;
                    break;
                case Common.ItemType.GraphicBoard:
                    image = Scene.ASSETS.GRAPHIC_BOARD.DATA;
                    break;
                case Common.ItemType.DVD:
                    image = Scene.ASSETS.DVD.DATA;
                    break;
                case Common.ItemType.Memory:
                    image = Scene.ASSETS.MEMORY.DATA;
                    break;
                case Common.ItemType.HDD:
                    image = Scene.ASSETS.HDD.DATA;
                    break;
                case Common.ItemType.Sweet:
                    image = Scene.ASSETS.SWEET.DATA;
                    break;
                case Common.ItemType.SDCard:
                    image = Scene.ASSETS.SD_CARD.DATA;
                    break;
            }
            return new ViewObject(obj, image, (sprite) => { sprite.frame = 0; }, () => { });
        }
    }

    /**
     * マップ上のオブジェクト
     */
    class ViewObject extends enchant.Group {
        private sprite: enchant.Sprite;
        private info: enchant.Label;
        private lastDir: Common.DIR;
        private frameUpdateLock = false;

        /**
         * @constructor
         */
        constructor(
            private data: Common.IObject,
            image: enchant.Surface,
            private _updateFrame: (sprite: enchant.Sprite) => void,
            private _updateAction: (sprite: enchant.Sprite, action: Common.Action, speed: number) => void,
            private marginX: number = 0,
            private marginY: number = 0,
            width: number = OBJECT_WIDTH,
            height: number = OBJECT_HEIGHT) {
            super();

            this.sprite = new enchant.Sprite(width, height);
            this.sprite.image = image;
            var coord = this.data.cell.coord;
            this.sprite.opacity = 0;
            this.moveTo((coord.x + this.marginX) * OBJECT_WIDTH, (coord.y + this.marginY) * OBJECT_HEIGHT);
            this.addChild(this.sprite);

            if (Common.DEBUG) {
                this.info = new enchant.Label();
                this.addChild(this.info);
            }
            this.lastDir = data.dir;
        }

        /**
         * フレームごとにUpdate
         * @param {Common.IFOVData} fov 視界情報
         * @param {number} speed 速度
         */
        updateFrame(): void {
            if (!this.frameUpdateLock) {
                this._updateFrame(this.sprite);
            }
        }

        /**
         * Actionの送信側Update
         * @param {Common.Action} action アクション
         * @param {number} speed 速度
         */
        updateAction(action: Common.Action, speed: number): void {
            this.frameUpdateLock = true;
            Scene.addAnimating();
            if (Common.DEBUG) {
                if (action.sender.isUnit()) {
                    var unit = <Common.IUnit>action.sender;
                    this.info.text = "[(" + unit.cell.coord.x + "," + unit.cell.coord.y + ")" + "dir:" + unit.dir + "]";
                }
            }
            this._updateAction(this.sprite, action, speed);
            this.sprite.tl.then(() => {
                this.frameUpdateLock = false;
                Scene.decAnimating();
            });
        }

        /**
         * オブジェクトの移動
         * @param {Common.Coord} coord 移動先座標
         * @param {number} speed 速度
         * @return {enchant.Timeline} スプライトのTL
         */
        move(coord: Common.Coord, speed: number): enchant.Timeline {
            Scene.addAnimating();
            return this.tl.moveTo((coord.x + this.marginX) * OBJECT_WIDTH, (coord.y + this.marginY) * OBJECT_HEIGHT, speed).then(function () {
                Scene.decAnimating();
            });
        }

        /**
         * オブジェクトを消す
         * @param {number} speed スピード
         * @return {enchant.Timeline} スプライトのTL
         */
        hide(speed: number): enchant.Timeline {
            var tl = this.sprite.tl;
            if (this.sprite.opacity == 1) {
                tl = tl.fadeOut(speed);
            }
            return tl;
        }

        /**
         * オブジェクトを表示
         * @param {number} speed スピード
         * @return {enchant.Timeline} スプライトのTL
         */
        show(speed: number): enchant.Timeline {
            var tl = this.sprite.tl;
            if (this.sprite.opacity == 0) {
                tl = tl.fadeIn(speed);
            }
            return tl;
        }

        /**
         * オブジェクトのID
         * @return {number} ID
         */
        get id(): number {
            return this.data.id;
        }

        /**
         * オブジェクトのレイヤー
         * @return {Common.Layer} レイヤー
         */
        get layer(): Common.Layer {
            return this.data.layer;
        }
    }
    
    /**
     * マップ(Ground, Floorレイヤー)
     */
    class Map extends enchant.Map {
        /**
         * @constructor
         */
        constructor(
            private getTable: () => number[][],
            image: enchant.Surface) {
            super(OBJECT_WIDTH, OBJECT_HEIGHT);
            this.image = image;
            this.update();
        }

        /**
         * Ground Layerのマップを取得
         * @param {number} width Width
         * @param {number} height Height
         * @param {(x: number, y: number) => Common.ICell} getTable 座標からCellを求める関数
         * @return {Map} マップ
         */
        public static ground(width: number, height: number, getTable: (x: number, y: number) => Common.ICell): Map {
            var table = (x, y) => { return getTable(x, y).ground };
            var getViewTable = () => { return Map.getGroundViewTable(width, height, table) };
            return new Map(getViewTable, Scene.ASSETS.WALL00.DATA);
        }

        /**
         * Floor Layerのマップを取得
         * @param {number} width Width
         * @param {number} height Height
         * @param {(x: number, y: number) => Common.ICell} getTable 座標からCellを求める関数
         * @return {Map} マップ
         */
        public static floor(width: number, height: number, getTable: (x: number, y: number) => Common.ICell): Map {
            var table = (x, y) => { return getTable(x, y).floor };
            var getViewTable = () => { return Map.getFloorViewTable(width, height, table) };
            return new Map(getViewTable, Scene.ASSETS.FLOOR.DATA);
        }

        /**
         * マップのアップデート
         */
        public update(): void {
            var viewTable = this.getTable();
            this.loadData(viewTable);
        }

        private static getFloorViewTable(w: number, h: number,
            table: (x: number, y: number) => Common.IObject): number[][]{
            var map: number[][] = [];
            var flg = true;

            for (var y = 0; y < h; y++) {
                map.push(new Array(w));
                for (var x = 0; x < w; x++) {
                    flg = !flg;
                    map[y][x] = flg ? 0 : 1;
                }
            }
            return map;
        }

        private static getGroundViewTable(w: number, h: number,
            table: (x: number, y: number) => Common.IObject): number[][] {
            var blockTable = [
                0, 17, 4, 4, 16, 36, 4, 4, // 0 - 7
                7, 26, 9, 9, 7, 26, 9, 9, // 8 - 15
                18, 32, 21, 21, 39, 40, 21, 21, // 16 - 23
                7, 26, 9, 9, 7, 26, 9, 9, // 24 - 31
                5, 22, 1, 1, 23, 45, 1, 1, // 32 - 39
                11, 30, 15, 15, 11, 30, 15, 15,// 40 - 47
                5, 22, 1, 1, 23, 45, 1, 1, // 48 - 55
                11, 30, 15, 15, 11, 30, 15, 15,// 56 - 63
                19, 38, 20, 20, 33, 41, 20, 20, // 64 - 71
                24, 46, 28, 28, 24, 46, 28, 28, // 72 - 79
                37, 43, 44, 44, 42, 34, 44, 44, // 80 - 87
                24, 46, 28, 28, 24, 46, 28, 28, // 88 - 95
                5, 22, 1, 1, 23, 45, 1, 1, // 96 - 103
                11, 30, 15, 15, 11, 30, 15, 15, // 104 - 111
                5, 22, 1, 1, 23, 45, 1, 1, // 112 - 119
                11, 30, 15, 15, 11, 30, 15, 15, // 120 - 127
                6, 6, 8, 8, 27, 27, 8, 8,// 128 - 135
                2, 2, 12, 12, 2, 2, 12, 12,// 136 - 143
                25, 25, 29, 29, 47, 47, 29, 29,// 144 - 151
                2, 2, 12, 12, 2, 2, 12, 12, // 152 - 159
                10, 10, 14, 14, 31, 31, 14, 14,// 160 - 167
                13, 13, 3, 3, 13, 13, 3, 3, // 168 - 175
                10, 10, 14, 14, 31, 31, 14, 14,// 176 - 183
                25, 25, 29, 29, 47, 47, 29, 29,// 184 - 191
                6, 6, 29, 29, 27, 27, 8, 8,//192 - 199
                2, 2, 12, 12, 2, 2, 12, 12,//200 - 207
                25, 25, 29, 29, 47, 47, 29, 29,//208 - 215
                2, 2, 12, 12, 2, 2, 12, 12,// 216 - 223
                10, 10, 14, 14, 31, 31, 14, 14,// 224 - 231
                13, 13, 3, 3, 13, 13, 3, 3, // 232 - 239
                10, 10, 14, 14, 31, 31, 14, 14,// 240 - 247
                13, 13, 3, 3, 13, 13, 3, 3, // 248 - 255
            ];
            var map: number[][] = [];

            for (var y = 0; y < h; y++) {
                map.push(new Array(w));
                for (var x = 0; x < w; x++) {
                    if (table(x, y).isWall()) {
                        var blockId = 0;
                        blockId |= (x == 0 || y == 0 || table(x - 1, y - 1).isWall()) ? 0 : 1;
                        blockId |= (y == 0 || table(x, y - 1).isWall()) ? 0 : 2;
                        blockId |= (x == w - 1 || y == 0 || table(x + 1, y - 1).isWall()) ? 0 : 4;
                        blockId |= (x == w - 1 || table(x + 1, y).isWall()) ? 0 : 8;
                        blockId |= (x == w - 1 || y == h - 1 || table(x + 1, y + 1).isWall()) ? 0 : 16;
                        blockId |= (y == h - 1 || table(x, y + 1).isWall()) ? 0 : 32;
                        blockId |= (x == 0 || y == h - 1 || table(x - 1, y + 1).isWall()) ? 0 : 64;
                        blockId |= (x == 0 || table(x - 1, y).isWall()) ? 0 : 128;

                        var mapId = blockTable[blockId];
                        map[y][x] = mapId;
                    } else {
                        map[y][x] = 35;
                    }
                }
            }
            return map;
        }
    }
}
