/**
 https://github.com/FelixVogel/Penguins
 Copyright (c) 2020 Felix Vogel

 For the full copyright and license information, please view the LICENSE
 file that was distributed with this source code.
 */

// Penguin code

class Behaviour {

    private readonly init: (data: Object) => void;
    private readonly update: (delta: number, data: Object) => void;

    public data: Object;

    constructor(init: (data: Object) => void, update: (delta: number, data: Object) => void) {
        this.init = init;
        this.update = update;
    }

    _init(penguin: Penguin) {
        this.data = {
            penguin: penguin
        };

        this.init(this.data);
    }

    _update(delta: number) {
        this.update(delta, this.data);
    }

}

class Penguin {

    private readonly behaviours: Behaviour[] = [
        // MoveBehaviour : 0
        new Behaviour((data) => {
            let penguin: Penguin = data['penguin'];

            let mod: 1 | -1 = 1;
            let immunityDistance: number = 0;

            if (penguin.getX() < 0 ) {
                mod = 1;

                immunityDistance = (penguin.getX() * -1) + 30;
            } else if (penguin.getX() > window.innerWidth) {
                mod = -1;

                immunityDistance = (penguin.getX() - window.innerWidth) + 30;
            } else mod = Math.random() >= 0.5 ? 1 : -1;

            let distance = Math.max(0.1, Math.min(0.9, Math.random())) * window.innerWidth;
            let speed = 25 + Math.random() * 10;

            data['penguin'].setDirection(mod);
            data['immunityDistance'] = immunityDistance;
            data['distance'] = distance + immunityDistance;
            data['speed'] = speed;

        }, (delta, data) => {
            let cover: number = data['speed'] * delta;

            if (data['immunityDistance'] <= 0 && (data['distance'] - cover < 0 || data['penguin'].getX() <= -30 || data['penguin'].getX() >= (window.innerWidth + 30))) {
                data['penguin'].killBehaviour();
            } else {
                if (data['immunityDistance'] > 0) {
                    data['immunityDistance'] -= cover;
                }

                data['distance'] -= cover;
                data['penguin'].setX(data['penguin'].getX() + data['penguin'].getDirection() * cover);
            }
        }),

        // WaitBehaviour
        new Behaviour((data) => {
            data['time'] = 500 + (Math.random() * 3000);
        }, (delta, data) => {
            data['time'] -= delta * 1000;

            if (data['time'] <= 0) {
                data['penguin'].killBehaviour();
            }
        }),

        // TraverseBehaviour
        new Behaviour((data) => {
            let distance = Math.ceil(Math.random() * (window.innerHeight - window.innerHeight * 0.95));

            data['distance'] = distance;
            data['speed'] = 2 + Math.random() * 10;
            data['mod'] = Math.random() >= 0.5 ? 1 : -1;
        }, (delta, data) => {
            let cover = data['speed'] * delta;

            if (data['distance'] - cover <= 0 ||
                data['penguin'].getY() + 20 + (cover * data['mod']) >= window.innerHeight ||
                data['penguin'].getY() + 20 + (cover * data['mod']) <= window.innerHeight * 0.95
            ) {
                data['penguin'].killBehaviour();
            } else {
                data['penguin'].setY(data['penguin'].getY() + (cover * data['mod']));
            }
        }),
    ];

    private x: number;
    private y: number;

    private direction: 1 | -1;

    private currentBehaviour = -1;
    private _new = true;

    constructor(initX: number, initY: number) {
        this.x = initX;
        this.y = initY;
    }

    update(delta: number) {
        if (this._new) {
            this._new = false;

            this.currentBehaviour = 0;
            this.behaviours[0]._init(this);
        }

        if (this.currentBehaviour == -1) {
            this.currentBehaviour = Math.ceil(Math.random() * this.behaviours.length) - 1;

            this.behaviours[this.currentBehaviour]._init(this);
        }

        this.behaviours[this.currentBehaviour]._update(delta);
    }

    public killBehaviour() {
        this.currentBehaviour = -1;
    }

    public getX(): number {
        return this.x;
    }

    public setX(x: number): void {
        this.x = x;
    }

    public getY(): number {
        return this.y;
    }

    public setY(y: number): void {
        this.y = y;
    }

    public getDirection(): number {
        return this.direction;
    }

    public setDirection(direction: 1 | -1): void {
        this.direction = direction;
    }

}

// Game
interface Point {
    x: number,
    y: number
}

const forEach = <T>(array: T[], element: (item: T, index?: number) => void) => {
    if(!array || !element || array.length == 0) return;

    for(let i: number = 0, l: number = array.length; i < l; i++) {
        element(array[i], i);
    }
}

const capsule = (fn: () => void): void => {
    fn();
};

const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('game');
const graphics: CanvasRenderingContext2D = canvas.getContext('2d');

const penguinScale = 0.3;

let assets: {
    penguin: HTMLImageElement,
    hill_overlay: HTMLImageElement
} = {
    penguin: undefined,
    hill_overlay: undefined
};

const loadAssets = (done: () => void) => {
    let loadedAssets = 0;

    const loadDone = (f: number = 1) => {
        loadedAssets += f;

        if (loadedAssets >= Object.keys(assets).length) {
            done();
        }
    };

    capsule(() => {
        let penguin = new Image();

        penguin.onload = () => {
            loadDone();
        };

        penguin.src = 'images/penguin.png';

        assets.penguin = penguin;
    });

    capsule(() => {
        let hill_overlay = new Image();

        hill_overlay.onload = () => {
            loadDone();
        };

        hill_overlay.src = 'images/hill_overlay.png';

        assets.hill_overlay = hill_overlay;
    });
};

const init = (): void => {

    let pw = assets.penguin.width * penguinScale;
    let ph = assets.penguin.height * penguinScale;

    const createBG = (): HTMLCanvasElement => {
        let buffer: HTMLCanvasElement = document.createElement('canvas');

        buffer.width = window.innerWidth;
        buffer.height = window.innerHeight;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let points: Point[] = [];

        let maxHeight: number = Math.ceil(window.innerHeight * ((60 + Math.floor(Math.random() * 5)) / 100));
        let minHeight: number = Math.ceil(window.innerHeight * ((20 + Math.floor(Math.random() * 5)) / 100));
        let dHeight: number = (maxHeight - minHeight) / 2;

        const createPoint = (x: number, y?: number) => {
            if (x && y) {
                points.push({
                    x,
                    y
                });

                return;
            }

            if (Math.random() <= 0.25) {
                let y = Math.ceil(minHeight + dHeight + (Math.random() * dHeight));

                points.push({
                    x,
                    y
                });
            } else {
                let y = Math.ceil(minHeight + (dHeight / 2) + (Math.random() * dHeight));

                points.push({
                    x,
                    y
                });
            }
        };

        const createHills = () => {
            createPoint(Math.ceil(25 + (Math.random() * 50)) * -1);

            for (let x: number = 0; x < window.innerWidth;) {
                let rng = Math.ceil(25 + (Math.random() * 50));

                x += rng;

                createPoint(x);
            }

            createPoint(window.innerWidth + 25, window.innerHeight + 50);
        };

        createHills();

        graphics.fillStyle = '#000000';
        graphics.strokeStyle = '#000000';

        graphics.beginPath();
        graphics.moveTo(-25, window.innerHeight + 50);

        forEach(points, (point, index) => {
            graphics.lineTo(point.x, point.y);
        });

        graphics.closePath();

        graphics.fill();

        // save current graphics
        graphics.save();

        // Overlay Hill Texture
        graphics.globalCompositeOperation = 'source-atop';

        graphics.drawImage(assets.hill_overlay, 0, Math.ceil(window.innerHeight * 0.3), window.innerWidth, Math.ceil(window.innerHeight * 0.7));

        // restore graphics
        graphics.restore();

        // paint snow layer
        graphics.save();

        graphics.stroke();

        graphics.fillStyle = '#ffffff';
        graphics.fillRect(0, Math.ceil(window.innerHeight * 0.95), window.innerWidth, window.innerHeight);

        graphics.restore();

        buffer.getContext('2d').drawImage(canvas, 0, 0);

        return buffer;
    };

    // Save background to save on rendering
    let bg: HTMLCanvasElement = createBG();

    // Penguin population
    let population: Penguin[] = [];

    const createPopulation = (): void => {
        const why = window.innerHeight * 0.95 - 20;
        const whdiff = window.innerHeight - (window.innerHeight * 0.95) - 5;

        population = [];

        let c = 20 + Math.floor(Math.random() * 10);

        for (let i = 0; i < c; i++) {
            population.push(new Penguin(Math.random() * (window.innerWidth - 30), why + Math.ceil(Math.random() * whdiff)));
        }
    };

    createPopulation();

    // on resize
    window.addEventListener('resize', () => {
        bg = createBG();
        createPopulation();
    });

    // Render loop
    let lastRender: number = 0;

    const loop = (timestamp: number): void => {
        let delta = (timestamp - lastRender) / 1000;

        graphics.clearRect(0, 0, window.innerWidth, window.innerHeight);

        graphics.drawImage(bg, 0, 0);

        // Update start

        forEach(population, (penguin) => penguin.update(delta));

        // Update end

        // Render start

        forEach(population, (penguin) => {
            if (penguin.getDirection() == 1) {
                graphics.drawImage(assets.penguin, penguin.getX(), penguin.getY(), pw, ph);
            } else {
                graphics.save();

                graphics.scale(-1, 1);
                graphics.translate(-pw, 0);
                graphics.drawImage(assets.penguin, -penguin.getX(), penguin.getY(), pw, ph);

                graphics.restore();
            }
        });

        // Render end

        lastRender = timestamp;
        window.requestAnimationFrame(loop);
    };

    lastRender = performance.now();
    window.requestAnimationFrame(loop);
};

window.addEventListener('load', () => {
    loadAssets(() => init());
});