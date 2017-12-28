var lenOfInstruc = 0;
class MemSet
{
    constructor()
    {
        this.value = 0;
        this.address = 0;
    }
}



class Operations
{
    intiate()
    {

        this.id = Operations.Size++;
        this.operandA = 0;
        this.execute = 0;
        this.operandC = 0;
        this.operandB = 0;
        this.operator = '';
        this.issue = 0;
        this.writeResult = 0;
    }
    constructor(op, A, B, C)
    {
        this.intiate();
        this.operandA = A;
        this.operator = op;
        this.operandC = C;
        this.operandB = B;
    }
    showOp(op)
    {
        if (op == 'A') return 'F' + this.operandA;
        else if (op == 'B')
        {
            if (this.operator != 'LD' && this.operator != 'ST') return 'F' + this.operandB;
            else return this.operandB;
        }
        else
        {
            if (this.operator != 'LD' && this.operator != 'ST') return 'F' + this.operandC;
            else return '';
        }
    }
}
Operations.Size = 0;

class QandV
{
    constructor(q, v)
    {
        this.set(q, v);
    }

    update(index, value)
    {
        if (this.Q == index)
        {
            this.Q = 0;
            this.V = value;
        }
    }
    set(q, v)
    {
        this.Q = q;
        this.V = v;
    }
    setQandV(qv)
    {
        this.Q = qv.Q;
        this.V = qv.V;
    }
    display()
    {
        if (this.Q == 0) return this.V;
        else return '#' + this.Q;
    }

}

class Reg
{
    constructor()
    {
        this.id = Reg.Size++;
        this.QandV = new QandV(0, 0);
    }
}
Reg.Size = 0;

class ResStation
{
    constructor(name)
    {
        this.state = 'IDLE';
        this.name = name;
        this.operation = null;
        this.id = ++ResStation.Size;
        this.time = 0;


    }
    displayOper()
    {
        if (this.operation == null) return '--';
        else return this.operation.operator;
    }
    isReady()
    {
        return this.state == 'WAITING';
    }



    displayTime()
    {
        if (this.state != 'RUNNING') return '--';
        else return this.time;
    }

    run()
    {
        this.state = 'RUNNING';
        --this.time;
    }
    clear()
    {
        this.operation = null;
        this.time = 0;
        this.state = 'IDLE';

    }
}
ResStation.Size = 0;
class AluStation extends ResStation
{
    constructor(name)
    {
        super(name);
        this.j = new QandV(0, 0);
        this.k = new QandV(0, 0);
    }
    isReady()
    {
        return super.isReady() && this.j.Q == 0 && this.k.Q == 0;
    }
}
class MemBuf extends ResStation
{
    constructor(name)
    {
        super(name);
        this.A = 0;
        this.Seq = 0;
    }
    displaySeq()
    {
        if (this.state == 'IDLE') return '--';
        else return this.Seq;
    }
    displayQandV()
    {
        return '--';
    }
    isReady()
    {
        return super.isReady() && this.Seq == vElement.RunningMemory;
    }
}
MemBuf.Seq = 0;
class LBuffer extends MemBuf
{
    constructor(name)
    {
        super(name);
    }
}
class SBuffer extends MemBuf
{
    constructor(name)
    {
        super(name);
        this.QandV = new QandV(0, 0);
    }
    displayQandV()
    {
        return this.QandV.display();
    }
    isReady()
    {
        return super.isReady() && this.QandV.Q == 0;
    }
}

var vElement = new Vue(
{
    el: '#app',
    data:
    {
        timestamp: 0,
        memorySetter: new MemSet(),
        Memory:
        {},
        MemoryIndex: [],
        InP: 0,
        Ops: [],
        Registers: [],
        RS: [],
        Buffer: [],
        RunningAdd: -1,
        RunningMul: -1,
        RunningMemory: 1
    },
    methods:
    {}
});


function OperationBuilder(line)
{

    var list = line.toUpperCase().replace(/,/g, ' ').split(/\s+/);
    if (list.length == 3)
    {
        list[3] = '0';
    }
    if (list.length != 4) return null;
    for (var i = 1; i <= 3; ++i)
    {
        if (list[i][0] == 'F') list[i] = list[i].substr(1);
        list[i] = parseInt(list[i]);
    }
    return new Operations(list[0], list[1], list[2], list[3]);
}

function intiate()
{
    var i;
    for (i = 0; i <= 10; ++i) vElement.Registers.push(new Reg());
    for (i = 1; i <= 3; ++i) vElement.RS.push(new AluStation('Add' + i));
    for (i = 1; i <= 2; ++i) vElement.RS.push(new AluStation('Mul' + i));
    for (i = 1; i <= 3; ++i) vElement.Buffer.push(new LBuffer('Load' + i));
    for (i = 1; i <= 3; ++i) vElement.Buffer.push(new SBuffer('Store' + i));
}
intiate();

function cleanArray(list)
{
    while (list.length > 0)
        list.pop();
}

function addToArray(list, item)
{
    item = parseInt(item);
    for (var i in list)
    {
        if (list[i] == item) return;
    }
    list.push(item);
}

function loadTheFile(files)
{
    if (files.length <= 0) return;
    cleanArray(vElement.Ops);
    vElement.InP = 0;
    var reader = new FileReader();
    reader.onload = function()
    {
        var lines = this.result.split('\n');
        console.log(lines.length);
        lenOfInstruc = lines.length;
        for (var i in lines)
        {
            //console.log(i);
            //console.log(lines[i]);
            var op = OperationBuilder(lines[i]);
            if (op != null)
                vElement.Ops.push(op);
        }
    };
    reader.readAsText(files[0]);
}

function removeFromArray(list, item)
{
    var buflst = [];
    var i = null;
    while (list.length > 0)
    {
        i = list.pop();
        if (i != item) buflst.push(i);
        else break;
    }
    while (buflst.length > 0)
    {
        i = buflst.pop();
        list.push(i);
    }
}

function strMem(addr, value)
{
    removeFromArray(vElement.MemoryIndex, addr);
    if (value != 0) addToArray(vElement.MemoryIndex, addr);
    vElement.Memory[addr] = value;
    if (value === 0)
        delete vElement.Memory[addr];
}

function ldMem(addr)
{
    if (vElement.Memory.hasOwnProperty(addr)) return vElement.Memory[addr];
    else return 0;
}

function runOneStep()
{
    ++vElement.timestamp;
    issueInstr();
    //if(lenOfInstruc == )
    compute();
}

function issueInstr()
{
    if (vElement.InP >= vElement.Ops.length) return;
    var inst = vElement.Ops[vElement.InP];
    var i, j;
    if (inst.operator == 'ADDD' || inst.operator == 'SUBD')
    {
        for (i = 0; i < 3; ++i)
            if (vElement.RS[i].state == 'IDLE') break;
        if (i == 3) return;
        vElement.RS[i].state = 'ISSUED';
        vElement.RS[i].operation = inst;
        vElement.RS[i].j.setQandV(vElement.Registers[inst.operandB].QandV);
        vElement.RS[i].k.setQandV(vElement.Registers[inst.operandC].QandV);
        vElement.RS[i].time = 2;
        vElement.Registers[inst.operandA].QandV.set(vElement.RS[i].id, 0);
    }
    else if (inst.operator == 'MULD' || inst.operator == 'DIVD')
    {
        for (i = 3; i < 5; ++i)
            if (vElement.RS[i].state == 'IDLE') break;
        if (i == 5) return;
        vElement.RS[i].state = 'ISSUED';
        vElement.RS[i].operation = inst;
        vElement.RS[i].j.setQandV(vElement.Registers[inst.operandB].QandV);
        vElement.RS[i].k.setQandV(vElement.Registers[inst.operandC].QandV);
        vElement.RS[i].time = (inst.operator == 'MULD') ? 10 : 40;
        vElement.Registers[inst.operandA].QandV.set(vElement.RS[i].id, 0);
    }
    else if (inst.operator == 'LD')
    {
        for (i = 0; i < 3; ++i)
            if (vElement.Buffer[i].state == 'IDLE') break;
        if (i == 3) return;
        vElement.Buffer[i].operation = inst;
        vElement.Buffer[i].state = 'ISSUED';
        vElement.Buffer[i].Seq = ++MemBuf.Seq;
        vElement.Buffer[i].A = inst.operandB;
        vElement.Buffer[i].time = 2;
        vElement.Registers[inst.operandA].QandV.set(vElement.Buffer[i].id, 0);
    }
    else if (inst.operator == 'ST')
    {
        for (i = 3; i < 6; ++i)
            if (vElement.Buffer[i].state == 'IDLE') break;
        if (i == 6) return;
        vElement.Buffer[i].operation = inst;
        vElement.Buffer[i].state = 'ISSUED';
        vElement.Buffer[i].Seq = ++MemBuf.Seq;
        vElement.Buffer[i].A = inst.operandB;
        vElement.Buffer[i].time = 2;
        vElement.Buffer[i].QandV.setQandV(vElement.Registers[inst.operandA].QandV);
    }
    else
    {
        return;
    }
    ++vElement.InP;
    inst.issue = vElement.timestamp;
}

function compute()
{
    var id, value;
    var i, j;
    var notify = {};
    //ADD
    for (i = 0; i < 3; ++i)
        if (vElement.RS[i].state == 'WRITING') vElement.RS[i].clear();
    for (i = 0; i < 3; ++i)
        if (vElement.RS[i].state == 'RUNNING') break;
    if (i == 3)
    {
        for (j = 0; j < 3; ++j)
        {
            if (vElement.RS[j].isReady())
            {
                vElement.RS[j].run();
                vElement.RunningAdd = j;
                vElement.RS[j].operation.execute = vElement.timestamp;
                break;
            }
        }
    }
    else
    {
        vElement.RS[i].run();
        if (vElement.RS[i].time == 0)
        {
            vElement.RS[i].state = 'WRITING';
            vElement.RS[i].operation.writeResult = vElement.timestamp + 1;
            notify[vElement.RS[i].id] = (vElement.RS[i].operation.operator == 'ADDD') ?
                (vElement.RS[i].j.V + vElement.RS[i].k.V) :
                (vElement.RS[i].j.V - vElement.RS[i].k.V);
        }
    }
    //MUL
    for (i = 3; i < 5; ++i)
        if (vElement.RS[i].state == 'WRITING') vElement.RS[i].clear();
    for (i = 3; i < 5; ++i)
        if (vElement.RS[i].state == 'RUNNING') break;
    if (i == 5)
    {
        for (j = 3; j < 5; ++j)
        {
            if (vElement.RS[j].isReady())
            {
                vElement.RS[j].run();
                vElement.RunningMul = j;
                vElement.RS[j].operation.execute = vElement.timestamp;
                break;
            }
        }
    }
    else
    {
        vElement.RS[i].run();
        if (vElement.RS[i].time == 0)
        {
            vElement.RS[i].state = 'WRITING';
            vElement.RS[i].operation.writeResult = vElement.timestamp + 1;
            notify[vElement.RS[i].id] = (vElement.RS[i].operation.operator == 'MULD') ?
                (vElement.RS[i].j.V * vElement.RS[i].k.V) :
                (vElement.RS[i].j.V / vElement.RS[i].k.V);
        }
    }
    //LD
    for (i = 0; i < 3; ++i)
        if (vElement.Buffer[i].state == 'WRITING') vElement.Buffer[i].clear();
    for (i = 0; i < 3; ++i)
        if (vElement.Buffer[i].state == 'RUNNING') break;
    if (i == 3)
    {
        for (j = 0; j < 3; ++j)
        {
            if (vElement.Buffer[j].isReady())
            {
                vElement.Buffer[j].run();
                vElement.Buffer[j].operation.execute = vElement.timestamp;
                break;
            }
        }
    }
    else
    {
        vElement.Buffer[i].run();
        if (vElement.Buffer[i].time == 0)
        {
            vElement.Buffer[i].state = 'WRITING';
            vElement.Buffer[i].operation.writeResult = vElement.timestamp + 1;
            ++vElement.RunningMemory;
            notify[vElement.Buffer[i].id] = ldMem(vElement.Buffer[i].A);
        }
    }
    //ST
    for (i = 3; i < 6; ++i)
        if (vElement.Buffer[i].state == 'RUNNING') break;
    if (i == 6)
    {
        for (j = 3; j < 6; ++j)
        {
            if (vElement.Buffer[j].isReady())
            {
                vElement.Buffer[j].run();
                vElement.Buffer[j].operation.execute = vElement.timestamp;
                break;
            }
        }
    }
    else
    {
        vElement.Buffer[i].run();
        if (vElement.Buffer[i].time == 0)
        {
            strMem(vElement.Buffer[i].A, vElement.Buffer[i].QandV.V);
            vElement.Buffer[i].operation.writeResult = vElement.timestamp + 1; //'--'

            vElement.Buffer[i].clear();
            ++vElement.RunningMemory;
        }
    }
    for (i = 0; i < 5; ++i)
        if (vElement.RS[i].state == 'ISSUED') vElement.RS[i].state = 'WAITING';
    for (i = 0; i < 6; ++i)
        if (vElement.Buffer[i].state == 'ISSUED') vElement.Buffer[i].state = 'WAITING';
    //notify
    console.log(notify);
    for (var index in notify)
    {
        value = notify[index];
        for (i = 0; i < 5; ++i)
        {
            vElement.RS[i].j.update(index, value);
            vElement.RS[i].k.update(index, value);
        }
        for (i = 3; i < 6; ++i)
        {
            vElement.Buffer[i].QandV.update(index, value);
        }
        for (i = 0; i <= 10; ++i)
        {
            vElement.Registers[i].QandV.update(index, value);
        }
    }
}

function runMultStep(n)
{
    for (var i = 0; i < n; ++i)
        runOneStep();
}

for (let _i = 0; _i < 20; ++_i)
{
    strMem(_i, _i);
}