import { reactive } from 'vue';

export class MemSet {
    value: number = 0;
    address: number = 0;
}

export class Operations {
    static Size = 0;
    id: number;
    operandA: number;
    execute: number;
    operandC: number;
    operandB: number;
    operator: string;
    issue: number;
    writeResult: number;

    constructor(op: string, A: number, B: number, C: number) {
        this.id = Operations.Size++;
        this.operandA = A;
        this.execute = 0;
        this.operandC = C;
        this.operandB = B;
        this.operator = op;
        this.issue = 0;
        this.writeResult = 0;
    }

    showOp(op: 'A' | 'B' | 'C'): string {
        if (op === 'A') return 'F' + this.operandA;
        else if (op === 'B') {
            if (this.operator !== 'LD' && this.operator !== 'ST') return 'F' + this.operandB;
            else return this.operandB.toString();
        } else {
            if (this.operator !== 'LD' && this.operator !== 'ST') return 'F' + this.operandC;
            else return '';
        }
    }
}

export class QandV {
    Q: number = 0;
    V: number = 0;

    constructor(q: number, v: number) {
        this.set(q, v);
    }

    update(index: string | number, value: number) {
        if (this.Q == index) {
            this.Q = 0;
            this.V = value;
        }
    }
    set(q: number, v: number) {
        this.Q = q;
        this.V = v;
    }
    setQandV(qv: QandV) {
        this.Q = qv.Q;
        this.V = qv.V;
    }
    display(): string | number {
        if (this.Q === 0) return this.V;
        else return '#' + this.Q;
    }
}

export class Reg {
    static Size = 0;
    id: number;
    QandV: QandV;

    constructor() {
        this.id = Reg.Size++;
        this.QandV = new QandV(0, 0);
    }
}

export class ResStation {
    static Size = 0;
    state: string;
    name: string;
    operation: Operations | null;
    id: number;
    time: number;

    constructor(name: string) {
        this.state = 'IDLE';
        this.name = name;
        this.operation = null;
        this.id = ++ResStation.Size;
        this.time = 0;
    }

    displayOper(): string {
        if (this.operation === null) return '--';
        else return this.operation.operator;
    }
    isReady(): boolean {
        return this.state === 'WAITING';
    }
    displayTime(): string | number {
        if (this.state !== 'RUNNING') return '--';
        else return this.time;
    }
    run() {
        this.state = 'RUNNING';
        --this.time;
    }
    clear() {
        this.operation = null;
        this.time = 0;
        this.state = 'IDLE';
    }
}

export class AluStation extends ResStation {
    j: QandV;
    k: QandV;

    constructor(name: string) {
        super(name);
        this.j = new QandV(0, 0);
        this.k = new QandV(0, 0);
    }
    isReady(): boolean {
        return super.isReady() && this.j.Q === 0 && this.k.Q === 0;
    }
}

export class MemBuf extends ResStation {
    static Seq = 0;
    A: number;
    Seq: number;

    constructor(name: string) {
        super(name);
        this.A = 0;
        this.Seq = 0;
    }
    displaySeq(): string | number {
        if (this.state === 'IDLE') return '--';
        else return this.Seq;
    }
    displayQandV(): string | number {
        return '--';
    }
    isReady(): boolean {
        return super.isReady() && this.Seq === state.RunningMemory;
    }
}

export class LBuffer extends MemBuf {
    constructor(name: string) {
        super(name);
    }
}

export class SBuffer extends MemBuf {
    QandV: QandV;
    constructor(name: string) {
        super(name);
        this.QandV = new QandV(0, 0);
    }
    displayQandV(): string | number {
        return this.QandV.display();
    }
    isReady(): boolean {
        return super.isReady() && this.QandV.Q === 0;
    }
}

export const state = reactive({
    timestamp: 0,
    memorySetter: new MemSet(),
    Memory: {} as Record<number, number>,
    MemoryIndex: [] as number[],
    InP: 0,
    Ops: [] as Operations[],
    Registers: [] as Reg[],
    RS: [] as AluStation[],
    Buffer: [] as MemBuf[],
    RunningAdd: -1,
    RunningMul: -1,
    RunningMemory: 1
});

export function OperationBuilder(line: string): Operations | null {
    let list = line.toUpperCase().replace(/,/g, ' ').split(/\s+/);
    if (list.length === 3) {
        list[3] = '0';
    }
    if (list.length !== 4) return null;
    let typedList: any[] = [];
    typedList[0] = list[0];
    for (let i = 1; i <= 3; ++i) {
        if (list[i][0] === 'F') list[i] = list[i].substr(1);
        typedList[i] = parseInt(list[i]);
    }
    return new Operations(typedList[0], typedList[1], typedList[2], typedList[3]);
}

export function initiate() {
    state.timestamp = 0;
    state.InP = 0;
    Operations.Size = 0;
    Reg.Size = 0;
    ResStation.Size = 0;
    MemBuf.Seq = 0;
    state.RunningMemory = 1;
    
    state.Ops = [];
    state.Registers = [];
    state.RS = [];
    state.Buffer = [];

    for (let i = 0; i <= 10; ++i) state.Registers.push(new Reg());
    for (let i = 1; i <= 3; ++i) state.RS.push(new AluStation('Add' + i));
    for (let i = 1; i <= 2; ++i) state.RS.push(new AluStation('Mul' + i));
    for (let i = 1; i <= 3; ++i) state.Buffer.push(new LBuffer('Load' + i));
    for (let i = 1; i <= 3; ++i) state.Buffer.push(new SBuffer('Store' + i));
    
    for (let _i = 0; _i < 20; ++_i) {
        strMem(_i, _i);
    }
}

export function loadTheFile(content: string) {
    state.Ops = [];
    state.InP = 0;
    Operations.Size = 0;
    
    const lines = content.split('\n');
    for (let i in lines) {
        let op = OperationBuilder(lines[i].trim());
        if (op != null)
            state.Ops.push(op);
    }
}

export function strMem(addr: number, value: number) {
    state.MemoryIndex = state.MemoryIndex.filter(a => a !== addr);
    if (value !== 0) state.MemoryIndex.push(addr);
    state.Memory[addr] = value;
    if (value === 0)
        delete state.Memory[addr];
}

export function ldMem(addr: number): number {
    if (state.Memory.hasOwnProperty(addr)) return state.Memory[addr];
    else return 0;
}

export function runOneStep() {
    ++state.timestamp;
    issueInstr();
    compute();
}

function issueInstr() {
    if (state.InP >= state.Ops.length) return;
    let inst = state.Ops[state.InP];
    let i = 0;
    if (inst.operator === 'ADDD' || inst.operator === 'SUBD') {
        for (i = 0; i < 3; ++i)
            if (state.RS[i].state === 'IDLE') break;
        if (i === 3) return;
        state.RS[i].state = 'ISSUED';
        state.RS[i].operation = inst;
        state.RS[i].j.setQandV(state.Registers[inst.operandB].QandV);
        state.RS[i].k.setQandV(state.Registers[inst.operandC].QandV);
        state.RS[i].time = 2;
        state.Registers[inst.operandA].QandV.set(state.RS[i].id, 0);
    } else if (inst.operator === 'MULD' || inst.operator === 'DIVD') {
        for (i = 3; i < 5; ++i)
            if (state.RS[i].state === 'IDLE') break;
        if (i === 5) return;
        state.RS[i].state = 'ISSUED';
        state.RS[i].operation = inst;
        state.RS[i].j.setQandV(state.Registers[inst.operandB].QandV);
        state.RS[i].k.setQandV(state.Registers[inst.operandC].QandV);
        state.RS[i].time = (inst.operator === 'MULD') ? 10 : 40;
        state.Registers[inst.operandA].QandV.set(state.RS[i].id, 0);
    } else if (inst.operator === 'LD') {
        for (i = 0; i < 3; ++i)
            if (state.Buffer[i].state === 'IDLE') break;
        if (i === 3) return;
        state.Buffer[i].operation = inst;
        state.Buffer[i].state = 'ISSUED';
        state.Buffer[i].Seq = ++MemBuf.Seq;
        state.Buffer[i].A = inst.operandB;
        state.Buffer[i].time = 2;
        state.Registers[inst.operandA].QandV.set(state.Buffer[i].id, 0);
    } else if (inst.operator === 'ST') {
        for (i = 3; i < 6; ++i)
            if (state.Buffer[i].state === 'IDLE') break;
        if (i === 6) return;
        state.Buffer[i].operation = inst;
        state.Buffer[i].state = 'ISSUED';
        state.Buffer[i].Seq = ++MemBuf.Seq;
        state.Buffer[i].A = inst.operandB;
        state.Buffer[i].time = 2;
        (state.Buffer[i] as SBuffer).QandV.setQandV(state.Registers[inst.operandA].QandV);
    } else {
        return;
    }
    ++state.InP;
    inst.issue = state.timestamp;
}

function compute() {
    let notify: Record<number, number> = {};
    let i, j;
    
    // ADD
    for (i = 0; i < 3; ++i)
        if (state.RS[i].state === 'WRITING') state.RS[i].clear();
    for (i = 0; i < 3; ++i)
        if (state.RS[i].state === 'RUNNING') break;
    if (i === 3) {
        for (j = 0; j < 3; ++j) {
            if (state.RS[j].isReady()) {
                state.RS[j].run();
                state.RunningAdd = j;
                if(state.RS[j].operation) state.RS[j].operation!.execute = state.timestamp;
                break;
            }
        }
    } else {
        state.RS[i].run();
        if (state.RS[i].time === 0) {
            state.RS[i].state = 'WRITING';
            if(state.RS[i].operation) state.RS[i].operation!.writeResult = state.timestamp + 1;
            notify[state.RS[i].id] = (state.RS[i].operation?.operator === 'ADDD') ?
                (state.RS[i].j.V + state.RS[i].k.V) :
                (state.RS[i].j.V - state.RS[i].k.V);
        }
    }
    
    // MUL
    for (i = 3; i < 5; ++i)
        if (state.RS[i].state === 'WRITING') state.RS[i].clear();
    for (i = 3; i < 5; ++i)
        if (state.RS[i].state === 'RUNNING') break;
    if (i === 5) {
        for (j = 3; j < 5; ++j) {
            if (state.RS[j].isReady()) {
                state.RS[j].run();
                state.RunningMul = j;
                if(state.RS[j].operation) state.RS[j].operation!.execute = state.timestamp;
                break;
            }
        }
    } else {
        state.RS[i].run();
        if (state.RS[i].time === 0) {
            state.RS[i].state = 'WRITING';
            if(state.RS[i].operation) state.RS[i].operation!.writeResult = state.timestamp + 1;
            notify[state.RS[i].id] = (state.RS[i].operation?.operator === 'MULD') ?
                (state.RS[i].j.V * state.RS[i].k.V) :
                (state.RS[i].j.V / state.RS[i].k.V);
        }
    }
    
    // LD
    for (i = 0; i < 3; ++i)
        if (state.Buffer[i].state === 'WRITING') state.Buffer[i].clear();
    for (i = 0; i < 3; ++i)
        if (state.Buffer[i].state === 'RUNNING') break;
    if (i === 3) {
        for (j = 0; j < 3; ++j) {
            if (state.Buffer[j].isReady()) {
                state.Buffer[j].run();
                if(state.Buffer[j].operation) state.Buffer[j].operation!.execute = state.timestamp;
                break;
            }
        }
    } else {
        state.Buffer[i].run();
        if (state.Buffer[i].time === 0) {
            state.Buffer[i].state = 'WRITING';
            if(state.Buffer[i].operation) state.Buffer[i].operation!.writeResult = state.timestamp + 1;
            ++state.RunningMemory;
            notify[state.Buffer[i].id] = ldMem(state.Buffer[i].A);
        }
    }
    
    // ST
    for (i = 3; i < 6; ++i)
        if (state.Buffer[i].state === 'RUNNING') break;
    if (i === 6) {
        for (j = 3; j < 6; ++j) {
            if (state.Buffer[j].isReady()) {
                state.Buffer[j].run();
                if(state.Buffer[j].operation) state.Buffer[j].operation!.execute = state.timestamp;
                break;
            }
        }
    } else {
        state.Buffer[i].run();
        if (state.Buffer[i].time === 0) {
            strMem(state.Buffer[i].A, (state.Buffer[i] as SBuffer).QandV.V);
            if(state.Buffer[i].operation) state.Buffer[i].operation!.writeResult = state.timestamp + 1;
            state.Buffer[i].clear();
            ++state.RunningMemory;
        }
    }
    
    for (i = 0; i < 5; ++i)
        if (state.RS[i].state === 'ISSUED') state.RS[i].state = 'WAITING';
    for (i = 0; i < 6; ++i)
        if (state.Buffer[i].state === 'ISSUED') state.Buffer[i].state = 'WAITING';
        
    // notify
    for (const indexStr in notify) {
        let index = parseInt(indexStr);
        let value = notify[indexStr];
        for (i = 0; i < 5; ++i) {
            state.RS[i].j.update(index, value);
            state.RS[i].k.update(index, value);
        }
        for (i = 3; i < 6; ++i) {
            (state.Buffer[i] as SBuffer).QandV.update(index, value);
        }
        for (i = 0; i <= 10; ++i) {
            state.Registers[i].QandV.update(index, value);
        }
    }
}

export function runMultStep(n: number) {
    for (let i = 0; i < n; ++i)
        runOneStep();
}
