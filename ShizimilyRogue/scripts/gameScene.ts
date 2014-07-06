
module ShizimilyRogue.View {
    // セルのサイズ
    var OBJECT_WIDTH = 64;
    var OBJECT_HEIGHT = 64;

    // メニューオープン時のキーロック開放処理フレーム数
    var KEY_LOCK_RELEASE = 10;

    export enum MenuType { Main, Item, Use }

    export class GameSceneData {
        constructor(
            public player: Common.IUnit,
            public width: number,
            public height: number,
            public objects: Common.IObject[],
            public getTable: (x: number, y: number) => Common.ICell) {
        }
    }

    export class GameScene extends Scene {
        private message: Message;
        private menuGroup: enchant.Group;
        private pathShadow: Shadow;
        private playerHp: PlayerHp;
        private clock: Clock;
        private miniMap: MiniMap;
        private view: View;
        public animateSpeed: number = 10;

        constructor(private data: GameSceneData, fov: Common.IFOVData) {
            super();

            this.message = new Message();
            this.pathShadow = GameScene.getPathShadow();
            this.view = new View(data, fov);
            this.playerHp = new PlayerHp();
            this.clock = new Clock();
            this.menuGroup = new enchant.Group();
            this.miniMap = new MiniMap(fov.width, fov.height);
            
            this.addChild(this.view);
            this.addChild(this.pathShadow);
            this.addChild(this.playerHp);
            this.addChild(this.clock);
            this.addChild(this.message);
            this.addChild(this.miniMap);
            this.addChild(this.menuGroup);
            
            this.addMenuKeyHandler();
            this.update(fov, [], 0);
        }

        private addMenuKeyHandler(): void {
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
                        this.tl.delay(KEY_LOCK_RELEASE).then(() => Scene.keyLock = false);
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

        showMenu(type: MenuType, data: string[], selectHandler: (n: number) => void, multiple: boolean = false): void {
            Scene.keyLock = true;
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

        closeMenu() {
            while (true) {
                this.menuGroup.removeChild(this.menuGroup.lastChild);
                if (this.menuGroup.childNodes.length == 0) {
                    break;
                }
                this.tl.delay(KEY_LOCK_RELEASE).then(() => Scene.keyLock = false);
            }
        }

        update(fov: Common.IFOVData, results: Common.IResult[], speed: number): void {
            var player = this.data.player;
            // 視界の表示
            this.pathShadow.visible = fov.getCell(player.coord).isPath();

            // プレイヤーHPの表示
            this.playerHp.show(player.hp, player.maxHp, player.stomach);

            // 時間の表示
            this.clock.show(player.turn);
            this.message.show(results, speed);
            this.view.update(fov, results, speed);
            this.miniMap.update(fov);
        }
    }

    class MiniMap extends enchant.Group {
        private static BLOCK_UNIT = 16;
        private static BLOCK_PLAYER = 19;
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
            this.groundMap.image = Scene.IMAGE.MINI_MAP.DATA;
            this.floorMap.image = Scene.IMAGE.MINI_MAP.DATA;
            this.groundMap.opacity = MiniMap.ALPHA;
            this.floorMap.opacity = MiniMap.ALPHA;
            this.addChild(this.floorMap);
            this.addChild(this.groundMap);
        }

        update(fov: Common.IFOVData) {
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

    class Message extends enchant.Group {
        private static MESSAGE_TOP = 405;
        private static MESSAGE_LEFT = 255;
        private static MESSAGE_WIDTH = VIEW_WIDTH - Message.MESSAGE_LEFT;
        private static MESSAGE_HEIGHT = 20;
        private static MESSAGE_AREA_OPACITY = 0.8;

        private messageArea: enchant.Sprite;
        private messageGroup: enchant.Group;
        private icon: enchant.Sprite;

        constructor() {
            super();
            this.messageArea = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            this.messageArea.image = Scene.IMAGE.MESSAGE.DATA;
            this.messageArea.opacity = Message.MESSAGE_AREA_OPACITY;
            this.icon = new enchant.Sprite(VIEW_WIDTH, VIEW_HEIGHT);
            this.icon.image = Scene.IMAGE.MESSAGE_ICON.DATA;

            this.messageGroup = new enchant.Group();
            this.addChild(this.messageArea);
            this.addChild(this.icon);
            this.addChild(this.messageGroup);
        }

        show(results: Common.IResult[], speed: number): void {
            var messages:string[] = []
            results.forEach(result => {
                var m = Data.Message[result.action.type];
                if (m != undefined) {
                    var str = m(result);
                    str = str.replace(/\{([^\}]+)\}/g, (tag: string, key: string, offset: number, s: string) => {
                        var x: any = result;
                        key.split(".").forEach(elem => {
                            var index = -1;
                            if (elem.match(/(.*)\[([^\]])+\]$/)) {
                                elem = RegExp.$1;
                                index = Number(RegExp.$2);
                            }
                            x = elem in x ? x[elem] : "";
                            if (index >= 0) {
                                x = x instanceof Array && index < x.length ? x[index] : "";
                            }
                            if (x == "") {
                                return x;
                            }
                        });
                        return x;
                    });
                    messages.push(str);
                }
            });
            this.setMessage(messages, speed);
        }

        private setMessage(messageList: string[], speed: number): void {
            this.removeChild(this.messageGroup);
            var messageGroup = new enchant.Group();
            messageGroup.x = Message.MESSAGE_LEFT;
            messageGroup.y = Message.MESSAGE_TOP;
            this.messageGroup = messageGroup;
            var tl: enchant.Timeline = this.messageGroup.tl;

            var firstWait = speed * 3;
            var upSpeed = speed * 0.8;

            for (var i = 0; i < messageList.length; i++) {
                var label = new enchant.Label();
                label = new enchant.Label();
                label.y = i * Message.MESSAGE_HEIGHT;
                label.font = "16px cursive";
                label.color = "white";
                label.width = Message.MESSAGE_WIDTH;
                label.text = " " + messageList[i];
                label.visible = false;
                messageGroup.addChild(label);

                if (i > 2) {
                    tl = tl.delay(i == 3 ? firstWait : upSpeed).then(() => {
                        messageGroup.removeChild(messageGroup.firstChild);
                    }).moveBy(0, -Message.MESSAGE_HEIGHT, upSpeed).then((e) => {
                        messageGroup.childNodes[2].visible = true;
                    }).delay(upSpeed).then(() => {
                    });
                } else {
                    label.visible = true;
                }
            }
            this.addChild(this.messageGroup);
        }

        set visible(flg: boolean) {
            this.messageArea.visible = flg;
            this.icon.visible = flg;
            this.messageGroup.childNodes.forEach(node => node.visible = flg);
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

    class View extends enchant.Group {
        private objects: ViewObject[] = [];

        private roomShadow: Shadow;
        private floorMap: Map;
        private groundMap: Map;
        private layer: enchant.Group[];

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

            this.update(fov, [], 0);
        }

        update(fov: Common.IFOVData, results: Common.IResult[], speed: number): void {
            this.updateShadow(fov);
            this.updateObjects(fov, results, speed);
            this.moveCamera(speed);
        }

        private updateObjects(fov: Common.IFOVData, results: Common.IResult[], speed: number): void {
            // 見えているIDを取得
            var visible: { [id: number]: boolean } = {};
            var index: { [id: number]: number } = {};
            fov.objects.forEach(unit => {
                visible[unit.id] = true;
            });
            visible[fov.me.id] = true;

            this.objects.forEach(viewUnit => {
                var ret = this.data.objects.filter(unit => viewUnit.id == unit.id);
                if (ret.length == 0 && viewUnit.id != Common.PLAYER_ID) {
                    // Dataの情報としてないが、Viewにはある＝消えたユニット
                    var layer = this.layer[viewUnit.layer]
                    layer.tl.delay(speed).then(() => layer.removeChild(viewUnit));
                }
            });

            // ユニットが新規作成された
            var i = 0;
            this.objects = this.data.objects.map(unit => {
                index[unit.id] = i++;
                var ret = this.objects.filter(viewUnit => viewUnit.id == unit.id);
                var u: ViewObject;
                if (ret.length == 0) {
                    // Viewの情報としてないが、Dataにはある＝新規ユニット
                    u = ViewObjectFactory.getInstance(unit);
                    this.layer[u.layer].addChild(u);
                } else {
                    // 元からある
                    u = ret[0];
                }
                // ついでに見えてるかどうかを入れておく
                if (u.visible && !visible[unit.id]) {
                    u.fadeOut(speed);
                } else if (!u.visible && visible[unit.id]) {
                    u.fadeIn(speed);
                
                }

                if (u.visible) {
                    u.update();
                }
                return u;
            });

            // ユニットに行動を起こさせる

            results.forEach(result => {
                var id = result.object.id;
                var unit = this.objects[index[id]];
                // FOVにあるものだけを表示
                unit.action(result, speed);
            });
        }

        // 視点移動
        private moveCamera(speed: number): void {
            var coord = this.data.objects[Common.PLAYER_ID].coord;
            var x = VIEW_WIDTH / 2 - coord.x * OBJECT_WIDTH;
            var y = VIEW_HEIGHT / 2 - coord.y * OBJECT_HEIGHT;
            Scene.addAnimating();
            this.tl.moveTo(x, y, speed).then(function () {
                Scene.decAnimating();
            });
        }

        // 部屋にいる時の影
        private updateShadow(fov: Common.IFOVData): void {
            var objs = fov.getCell(fov.me.coord);
            if (fov.getCell(fov.me.coord).isRoom()) {
                this.roomShadow.visible = true;
                this.roomShadow.update(fov.area);
            } else {
                this.roomShadow.visible = false;
            }
        }
    }
    

    class Menu extends enchant.Group {
        private static TOP_MARGIN = 36;
        private static LEFT_MARGIN = 36;
        private static LINE_SIZE = 36;
        private menuArea: enchant.Sprite;
        private elements: enchant.Group = null;
        private cursor: enchant.Sprite;
        private cursorIndex: number = 0;

        static Main(data: string[], selectHandler: (n: number) => void, multiple: boolean = false): Menu {
            return new Menu(data, selectHandler, multiple, Scene.IMAGE.MEMU_MAIN.DATA, 10, 10, 3);
        }

        static Item(data: string[], selectHandler: (n: number) => void, multiple: boolean = false): Menu {
            return new Menu(data, selectHandler, multiple, Scene.IMAGE.ITEM_WINDOW.DATA, 10, 10, 10);
        }

        static Use(data: string[], selectHandler: (n: number) => void, multiple: boolean = false): Menu {
            return new Menu(data, selectHandler, multiple, Scene.IMAGE.USE_MENU.DATA, 400, 10, 4);
        }

        constructor(
            data: string[],
            private selectHandler: (n: number) => void,
            private multiple: boolean,
            background: enchant.Surface,
            left: number, top: number,
            private size: number) {
            super();
            this.menuArea = new enchant.Sprite(background.width, background.height);
            this.menuArea.image = background;
            var imgCursor = Scene.IMAGE.CURSOR.DATA;
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

        public setMenuElement(data: string[]): void {
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
                label.x = Menu.LEFT_MARGIN + Scene.IMAGE.CURSOR.DATA.width;
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

        public up(): void {
            if (this.cursorIndex > 0)
                this.cursorIndex--;
            this.show();
        }

        public down(): void {
            if (this.cursorIndex < this.elements.childNodes.length - 1)
                this.cursorIndex++;
            this.show();
        }

        public select(): void {
            if (this.cursor.visible)
                this.selectHandler(this.cursorIndex);
        }
    }

    class Shadow extends enchant.Map {
        constructor(
            private w: number,
            private h: number) {
            super(OBJECT_WIDTH, OBJECT_HEIGHT);
            this.image = Scene.IMAGE.SHADOW.DATA;
        }

        public update(area: Common.Coord[]) {
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

    class ViewObjectFactory {
        static getInstance(object: Common.IObject): ViewObject {
            if (object.isPlayer())
                return ViewObjectFactory.getPlayerInstance(object);
            else if (object.isUnit())
                return ViewObjectFactory.getUnitInstance(object);
            else if (object.isItem())
                return ViewObjectFactory.getItemInstance(object);
        }

        private static getPlayerInstance(obj: Common.IObject): ViewObject {
            var frame = () => {
                var x: number[][] = [
                    [0],
                    [0],
                    [0],
                    [0],
                    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3],
                    [8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 11, 11],
                    [4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7],
                    [0]
                ];
                var ret: number[] = x[obj.dir];
                return ret;
            }
            return new ViewObject(obj, Scene.IMAGE.SHIZIMILY.DATA, frame, -0.5, -1, 128, 96);
        }

        private static getUnitInstance(obj: Common.IObject): ViewObject {
            return new ViewObject(obj, Scene.IMAGE.UNIT.DATA, () => [1], 0, -0.5);
        }

        private static getItemInstance(obj: Common.IObject): ViewObject {
            return new ViewObject(obj, Scene.IMAGE.ITEM.DATA, () => [1]);
        }
    }

    class ViewObject extends enchant.Group {
        private sprite: enchant.Sprite;
        private info: enchant.Label;
        public visible = false;

        constructor(
            private data: Common.IObject,
            image: enchant.Surface,
            private frame: () => number[],
            private marginX: number = 0,
            private marginY: number = 0,
            width: number = OBJECT_WIDTH,
            height: number = OBJECT_HEIGHT) {
            super();

            this.sprite = new enchant.Sprite(width, height);
            this.sprite.image = image;
            this.sprite.frame = frame();
            this.sprite.opacity = 0;
            var coord = this.data.coord;
            this.moveTo((coord.x + this.marginX) * OBJECT_WIDTH, (coord.y + this.marginY) * OBJECT_HEIGHT);
            this.addChild(this.sprite);

            if (Common.DEBUG) {
                this.info = new enchant.Label();
                this.addChild(this.info);
            }
        }

        update(): void {
            this.sprite.frame = this.frame();
        }

        action(result: Common.IResult, speed: number): void {
            if (Common.DEBUG) {
                if (result.object.isUnit()) {
                    var unit = <Common.IUnit>result.object;
                    this.info.text = "[dir:" + unit.dir + "]";
                }
            }
            if (this.visible == false) {
                var coord = this.data.coord;
                this.moveTo((coord.x + this.marginX) * OBJECT_WIDTH, (coord.y + this.marginY) * OBJECT_HEIGHT);
                return;
            }
            if (result.action.type == Common.ActionType.Move) {
                var coord = this.data.coord;
                Scene.addAnimating();
                this.tl.moveTo((coord.x + this.marginX) * OBJECT_WIDTH, (coord.y + this.marginY) * OBJECT_HEIGHT, speed).then(function () {
                    Scene.decAnimating();
                });
            } else if (result.action.type == Common.ActionType.Fly) {
                //var src = result.action.coords[0];
                //var dst = result.object.coord;
                //this.x = src.x;
                //this.y = src.y;
                //this.tl.moveBy(dst.x, dst.y, speed);
            }
        }

        fadeOut(speed: number) {
            this.sprite.tl.fadeOut(speed).then(() => this.visible = false);
        }

        fadeIn(speed: number) {
            this.visible = true;
            this.sprite.tl.fadeIn(speed);
        }

        get id(): number {
            return this.data.id;
        }

        get layer(): Common.Layer {
            return this.data.layer;
        }
    }
    
    class Map extends enchant.Map {
        constructor(
            private getTable: () => number[][],
            image: enchant.Surface) {
            super(OBJECT_WIDTH, OBJECT_HEIGHT);
            this.image = image;
            this.update();
        }

        public static ground(width: number, height: number, getTable: (x: number, y: number) => Common.ICell) {
            var table = (x, y) => { return getTable(x, y).ground };
            var getViewTable = () => { return Map.getGroundViewTable(width, height, table) };
            return new Map(getViewTable, Scene.IMAGE.WALL.DATA);
        }

        public static floor(width: number, height: number, getTable: (x: number, y: number) => Common.ICell) {
            var table = (x, y) => { return getTable(x, y).floor };
            var getViewTable = () => { return Map.getFloorViewTable(width, height, table) };
            return new Map(getViewTable, Scene.IMAGE.FLOOR.DATA);
        }

        public update() {
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
                6, 6, 29, 29, 27, 27, 8, 8,// 128 - 135
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
