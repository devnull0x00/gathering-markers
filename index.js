'use strict'

module.exports = function GatheringMarkers(mod) {
    let active = true;
    let idMod = 2n;
	let marks = [];
    
	mod.command.add('gathering', {
		$default() {
			mod.command.message('Gathering Marker module. Usage:');
			mod.command.message('   /8 gathering - Turn module on/off');
			mod.command.message('   /8 gathering off - Turn module off');
			mod.command.message('   /8 gathering on - Turn module on');
			mod.command.message('   /8 gathering status - Shows module status');
			mod.command.message('   /8 gathering alerts - Toggles system notices');
			mod.command.message('   /8 gathering messager - Toggles proxy messages');
			mod.command.message('   /8 gathering markers - Toggles item markers');
			mod.command.message('   /8 gathering clear - Clears item markers');
		},
		off() {
			mod.settings.enabled = false;
			mod.command.message('Module: disabled');
		},
		on() {
			mod.settings.enabled = true;
			mod.command.message('Module: enabled');
		},
		status() {
			mod.command.message('Module: ' + (mod.settings.enabled ? 'enabled' : 'disabled'));
			if (mod.settings.enabled) {
				mod.command.message('System popup notice: ' + (mod.settings.alerts ? 'enabled' : 'disabled'));
				mod.command.message('Proxy messages: ' + (mod.settings.messager ? 'enabled' : 'disabled'));
				mod.command.message('Item markers: ' + (mod.settings.markEnabled ? 'enabled' : 'disabled'));
			}
		},
		alerts() {
			mod.settings.alerts = !mod.settings.alerts;
			mod.command.message('System popup notice: ' + (mod.settings.alerts ? 'enabled' : 'disabled'));
		},
		messager() {
			mod.settings.messager = !mod.settings.messager;
			mod.command.message('Proxy messages: ' + (mod.settings.messager ? 'enabled' : 'disabled'));
		},
		markers() {
			mod.settings.markEnabled = !mod.settings.markEnabled;
			mod.command.message('Item markers: ' + (mod.settings.markEnabled ? 'enabled' : 'disabled'));
		},
		clear() {
			if (mod.settings.markEnabled) {
				mod.command.message("Markers cleared");
				clearMarks();
			}
		},
		$none() {
			mod.settings.enabled = !mod.settings.enabled;
			mod.command.message('Module: ' + (mod.settings.enabled ? 'enabled' : 'disabled'));
		}
	})

    mod.hook('S_LOGIN', 14, (event) => {

    })
    
    mod.hook('S_CURRENT_CHANNEL', 2, event => {

	})
	
    mod.hook('S_SPAWN_COLLECTION', 4, (event) => {
        if (!mod.settings.enabled || !active) return;
        if (!mod.settings.whiteList.includes(event.id)) return false;

        if (mod.settings.markEnabled) {   
            if (mod.settings.markList.includes(event.id) && !marks.includes(event.gameId)) {
                spawnMark(event.gameId*idMod, event.loc);
                marks.push(event.gameId);
            }
        }
        
        if (mod.settings.alerts) notice('Found ' + event.id)
        
        if (mod.settings.messager) mod.command.message('Found ' + event.id)
            
    })
        
    mod.hook('S_DESPAWN_COLLECTION', 2, (event) => {
        if (marks.includes(event.gameId)) {
            despawnMark(event.gameId*idMod)
            marks.splice(marks.indexOf(event.gameId), 1);
        }
    })
    
	mod.hook('S_LOAD_TOPO', 3, event => {
        active = event.zone < 9000;
		marks = [];
	})

	function spawnMark(idRef, loc) {
        loc.z -= 100;
		mod.send('S_SPAWN_DROPITEM', 8, {
			gameId: idRef,
			loc: loc,
			item: mod.settings.itemId, 
			amount: 1,
			expiry: 300000,
			explode:false,
			masterwork:false,
			enchant:0,
			source:0,
			debug:false,
			owners: [{id: 0}]
		})
	}
	
	function despawnMark(idRef) {
		mod.send('S_DESPAWN_DROPITEM', 4, {
			gameId: idRef
		});
	}
	
	function clearMarks() {
		for (let id of marks) {
			despawnMark(id*idMod);
		}
	}
    
	function notice(msg) {
		mod.send('S_DUNGEON_EVENT_MESSAGE', 2, {
            type: 43,
            chat: false,
            channel: 0,
            message: msg
        })
    }
	
    this.destructor = function() {
        mod.command.remove('gathering');
		clearMarks();
    }
}