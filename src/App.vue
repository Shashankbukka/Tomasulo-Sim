<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { state, initiate, loadTheFile, runOneStep, runMultStep, strMem } from './simulator';
import { examples } from './examples';

const multiStepCount = ref(3);
const memoryInput = ref({ addr: 0, value: 0 });
const selectedExample = ref('');

onMounted(() => {
  initiate();
});

const loadExample = () => {
  if (selectedExample.value && examples[selectedExample.value]) {
    loadTheFile(examples[selectedExample.value]);
  }
};

const onFileSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    loadTheFile(text);
    selectedExample.value = ''; // Reset dropdown
  };
  reader.readAsText(file);
};

const triggerFileInput = () => {
  document.getElementById('fileUpload')?.click();
};

const handleSetMemory = () => {
  strMem(memoryInput.value.addr, memoryInput.value.value);
};
</script>

<template>
  <div class="header-bar">
    <div class="brand">
      <i class="fa-solid fa-microchip" style="margin-right: 8px;"></i> Tomasulo Simulator
    </div>
    
    <div class="header-controls">
      <select v-model="selectedExample" @change="loadExample" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 12px; border-radius: 6px; outline: none; cursor: pointer;">
        <option value="" disabled>Load Example...</option>
        <option value="basic_math">01: Basic Math</option>
        <option value="data_hazards">02: Data Hazards</option>
        <option value="structural_hazards">03: Structural Hazards</option>
      </select>

      <button @click="triggerFileInput" title="Upload your own file">
        <i class="fa-solid fa-upload"></i> Upload
        <input id="fileUpload" type="file" style="display: none" @change="onFileSelected" />
      </button>

      <button @click="runOneStep()">
        <i class="fa-solid fa-play"></i> Step
      </button>

      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="number" v-model="multiStepCount" min="1" style="width: 70px" />
        <button @click="runMultStep(multiStepCount)">
          <i class="fa-solid fa-forward-step"></i> Run Multiple
        </button>
      </div>
      
      <div style="font-weight: bold; background: rgba(0,0,0,0.3); padding: 8px 16px; border-radius: 6px;">
        Clock: {{ state.timestamp }}
      </div>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 32px; max-width: 1400px; margin: 0 auto;">
    
    <!-- Left Column -->
    <div>
      <div class="glass-panel">
        <h3><i class="fa-solid fa-list-check" style="margin-right: 8px; color: #4facfe;"></i> Instruction Queue</h3>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Op</th>
                <th>Dest</th>
                <th>Src1</th>
                <th>Src2</th>
                <th>Issue</th>
                <th>Exec</th>
                <th>Write</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="op in state.Ops" :key="op.id" :style="{ backgroundColor: state.InP === op.id ? 'rgba(79, 172, 254, 0.2)' : 'transparent' }">
                <td><i v-if="state.InP === op.id" class="fa-solid fa-arrow-right" style="color: #00f2fe;"></i></td>
                <td>{{ op.id }}</td>
                <td><strong style="color: #00f2fe">{{ op.operator }}</strong></td>
                <td>{{ op.showOp('A') }}</td>
                <td>{{ op.showOp('B') }}</td>
                <td>{{ op.showOp('C') }}</td>
                <td>{{ op.issue === 0 ? '--' : op.issue }}</td>
                <td>{{ op.execute === 0 ? '--' : op.execute }}</td>
                <td>{{ op.writeResult === 0 ? '--' : op.writeResult }}</td>
              </tr>
              <tr v-if="state.Ops.length === 0">
                <td colspan="9" style="text-align: center; padding: 32px; color: rgba(255,255,255,0.5);">No program loaded.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="glass-panel">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0;"><i class="fa-solid fa-memory" style="margin-right: 8px; color: #4facfe;"></i> Memory</h3>
          <div style="display: flex; gap: 8px;">
            <input type="number" v-model="memoryInput.addr" placeholder="Addr" style="width: 80px;" min="0" />
            <input type="number" v-model="memoryInput.value" placeholder="Val" style="width: 80px;" />
            <button @click="handleSetMemory"><i class="fa-solid fa-pen"></i> Set</button>
          </div>
        </div>
        
        <div style="max-height: 400px; overflow-y: auto;">
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="addr in state.MemoryIndex" :key="addr">
                <td style="color: #a0aec0;">0x{{ addr.toString(16).padStart(4, '0').toUpperCase() }}</td>
                <td><strong>{{ state.Memory[addr] }}</strong></td>
              </tr>
              <tr v-if="state.MemoryIndex.length === 0">
                <td colspan="2" style="text-align: center; color: rgba(255,255,255,0.5);">Memory is empty.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Right Column -->
    <div>
      <div class="glass-panel">
        <h3><i class="fa-solid fa-microchip" style="margin-right: 8px; color: #00f2fe;"></i> Reservation Stations</h3>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Name</th>
                <th>State</th>
                <th>Op</th>
                <th>Vj / Qj</th>
                <th>Vk / Qk</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rs in state.RS" :key="rs.id">
                <td>
                  <span v-if="rs.state === 'RUNNING'" style="background: rgba(0, 242, 254, 0.2); color: #00f2fe; padding: 2px 8px; border-radius: 4px; font-weight: bold;">
                    {{ rs.time }}
                  </span>
                  <span v-else>--</span>
                </td>
                <td><strong>{{ rs.name }}</strong></td>
                <td>
                  <span :style="{
                    color: rs.state === 'RUNNING' ? '#00f2fe' : rs.state === 'WAITING' ? '#f59e0b' : rs.state === 'WRITING' ? '#10b981' : '#a0aec0'
                  }">{{ rs.state }}</span>
                </td>
                <td>{{ rs.displayOper() }}</td>
                <td>{{ rs.j.display() }}</td>
                <td>{{ rs.k.display() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="glass-panel">
        <h3><i class="fa-solid fa-layer-group" style="margin-right: 8px; color: #00f2fe;"></i> Load/Store Buffers</h3>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Seq</th>
                <th>Time</th>
                <th>Name</th>
                <th>State</th>
                <th>Address</th>
                <th>V / Q</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="buf in state.Buffer" :key="buf.id">
                <td>{{ buf.displaySeq() }}</td>
                <td>
                  <span v-if="buf.state === 'RUNNING'" style="background: rgba(0, 242, 254, 0.2); color: #00f2fe; padding: 2px 8px; border-radius: 4px; font-weight: bold;">
                    {{ buf.time }}
                  </span>
                  <span v-else>--</span>
                </td>
                <td><strong>{{ buf.name }}</strong></td>
                <td>
                  <span :style="{
                    color: buf.state === 'RUNNING' ? '#00f2fe' : buf.state === 'WAITING' ? '#f59e0b' : buf.state === 'WRITING' ? '#10b981' : '#a0aec0'
                  }">{{ buf.state }}</span>
                </td>
                <td>{{ buf.A !== 0 ? buf.A : '--' }}</td>
                <td>{{ buf.displayQandV() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="glass-panel">
        <h3><i class="fa-solid fa-database" style="margin-right: 8px; color: #00f2fe;"></i> Register Status</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px;">
          <div v-for="reg in state.Registers" :key="reg.id" style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
            <div style="color: #a0aec0; font-size: 0.8rem; margin-bottom: 4px;">F{{ reg.id }}</div>
            <strong :style="{ color: reg.QandV.Q !== 0 ? '#f59e0b' : '#10b981' }">
              {{ reg.QandV.display() }}
            </strong>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>
