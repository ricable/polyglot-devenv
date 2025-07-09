const { WasmSwarmCoordinator } = require('wasm-swarm-coordinator');

async function main() {
    console.log('🎯 Initializing WebAssembly Swarm Coordinator...');
    const coordinator = new WasmSwarmCoordinator(5);
    
    console.log('🤖 Spawning agents...');
    const leadId = coordinator.spawn_agent('coordinator', 'SwarmLead', '["coordination", "management"]');
    const devId = coordinator.spawn_agent('coder', 'RustDev', '["rust", "wasm"]');
    const testId = coordinator.spawn_agent('tester', 'QATester', '["testing", "validation"]');
    
    console.log('📋 Creating tasks...');
    const taskId1 = coordinator.create_task('Implement core logic', 3, '[]');
    const taskId2 = coordinator.create_task('Write tests', 2, `["${taskId1}"]`);
    
    console.log('🔗 Assigning tasks...');
    coordinator.assign_task(taskId1, devId);
    coordinator.assign_task(taskId2, testId);
    
    console.log('📊 Swarm status:', coordinator.get_swarm_status());
    
    console.log('💾 Storing memory...');
    coordinator.store_memory('project_status', 'initialization_complete');
    
    console.log('🔍 Retrieving memory:', coordinator.retrieve_memory('project_status'));
    
    console.log('✅ WebAssembly Swarm Coordinator demo complete!');
}

main().catch(console.error);
