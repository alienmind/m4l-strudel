{
	"patcher": {
		"fileversion": 1,
		"appversion": {
			"major": 9,
			"minor": 1,
			"revision": 4,
			"architecture": "x64",
			"modernui": 1
		},
		"classnamespace": "box",
		"rect": [100.0, 100.0, 640.0, 640.0],
		"gridsize": [8.0, 8.0],
		"boxes": [
			{
				"box": {
					"id": "obj-comment",
					"maxclass": "comment",
					"numinlets": 0,
					"numoutlets": 0,
					"patching_rect": [16.0, 8.0, 600.0, 32.0],
					"text": "SKELETON PATCH - not hand-verified in the Max editor. Check voice stealing, envelope timing and selector~ wiring before relying on this in a live set.",
					"fontsize": 9.0
				}
			},
			{
				"box": {
					"id": "obj-in1",
					"maxclass": "newobj",
					"text": "in 1",
					"numinlets": 0,
					"numoutlets": 1,
					"outlettype": [""],
					"patching_rect": [16.0, 48.0, 40.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-route-note",
					"maxclass": "newobj",
					"text": "route note",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": ["", ""],
					"patching_rect": [16.0, 80.0, 100.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-unpack",
					"maxclass": "newobj",
					"text": "unpack 0 0. 0 s 0. 0.",
					"numinlets": 1,
					"numoutlets": 6,
					"outlettype": ["int", "float", "int", "", "float", "float"],
					"patching_rect": [16.0, 112.0, 260.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-mtof",
					"maxclass": "newobj",
					"text": "mtof",
					"numinlets": 1,
					"numoutlets": 1,
					"outlettype": ["float"],
					"patching_rect": [16.0, 152.0, 40.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-cycle",
					"maxclass": "newobj",
					"text": "cycle~",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [16.0, 192.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-saw",
					"maxclass": "newobj",
					"text": "saw~",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [96.0, 192.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-rect",
					"maxclass": "newobj",
					"text": "rect~",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [176.0, 192.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-tri",
					"maxclass": "newobj",
					"text": "tri~",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [256.0, 192.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-sel",
					"maxclass": "newobj",
					"text": "sel sine sawtooth square triangle",
					"numinlets": 1,
					"numoutlets": 5,
					"outlettype": ["", "", "", "", ""],
					"patching_rect": [340.0, 112.0, 220.0, 20.0]
				}
			},
			{ "box": { "id": "obj-sel1msg", "maxclass": "message", "text": "1", "numinlets": 2, "numoutlets": 1, "patching_rect": [16.0, 232.0, 30.0, 20.0] } },
			{ "box": { "id": "obj-sel2msg", "maxclass": "message", "text": "2", "numinlets": 2, "numoutlets": 1, "patching_rect": [96.0, 232.0, 30.0, 20.0] } },
			{ "box": { "id": "obj-sel3msg", "maxclass": "message", "text": "3", "numinlets": 2, "numoutlets": 1, "patching_rect": [176.0, 232.0, 30.0, 20.0] } },
			{ "box": { "id": "obj-sel4msg", "maxclass": "message", "text": "4", "numinlets": 2, "numoutlets": 1, "patching_rect": [256.0, 232.0, 30.0, 20.0] } },
			{
				"box": {
					"id": "obj-selector",
					"maxclass": "newobj",
					"text": "selector~ 4",
					"numinlets": 5,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [16.0, 264.0, 120.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-dursplit",
					"maxclass": "newobj",
					"text": "t b f",
					"numinlets": 1,
					"numoutlets": 2,
					"outlettype": ["bang", "float"],
					"patching_rect": [420.0, 152.0, 60.0, 20.0]
				}
			},
			{ "box": { "id": "obj-attackmsg", "maxclass": "message", "text": "1. 5", "numinlets": 2, "numoutlets": 1, "patching_rect": [420.0, 192.0, 50.0, 20.0] } },
			{
				"box": {
					"id": "obj-muteonmsg",
					"maxclass": "message",
					"text": "mute 0",
					"numinlets": 2,
					"numoutlets": 1,
					"patching_rect": [480.0, 192.0, 55.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-releasedel",
					"maxclass": "newobj",
					"text": "del 50",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [""],
					"patching_rect": [420.0, 232.0, 60.0, 20.0]
				}
			},
			{ "box": { "id": "obj-releasemsg", "maxclass": "message", "text": "0. 50", "numinlets": 2, "numoutlets": 1, "patching_rect": [420.0, 264.0, 50.0, 20.0] } },
			{
				"box": {
					"id": "obj-mutedel",
					"maxclass": "newobj",
					"text": "del 60",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": [""],
					"patching_rect": [480.0, 264.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-muteoffmsg",
					"maxclass": "message",
					"text": "mute 1",
					"numinlets": 2,
					"numoutlets": 1,
					"patching_rect": [480.0, 296.0, 55.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-env",
					"maxclass": "newobj",
					"text": "line~",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [420.0, 296.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-envmul",
					"maxclass": "newobj",
					"text": "*~",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [16.0, 328.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-velgain",
					"maxclass": "newobj",
					"text": "* 0.75",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": ["float"],
					"patching_rect": [96.0, 152.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-levelmul",
					"maxclass": "newobj",
					"text": "*~ 0.",
					"numinlets": 2,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [16.0, 360.0, 60.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-lores",
					"maxclass": "newobj",
					"text": "lores~ 1000 0.3",
					"numinlets": 3,
					"numoutlets": 1,
					"outlettype": ["signal"],
					"patching_rect": [16.0, 392.0, 100.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-out1",
					"maxclass": "newobj",
					"text": "out~ 1",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [16.0, 432.0, 50.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-out2",
					"maxclass": "newobj",
					"text": "out~ 2",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [80.0, 432.0, 50.0, 20.0]
				}
			},
			{
				"box": {
					"id": "obj-thispoly",
					"maxclass": "newobj",
					"text": "thispoly~",
					"numinlets": 1,
					"numoutlets": 0,
					"patching_rect": [420.0, 328.0, 70.0, 20.0]
				}
			}
		],
		"lines": [
			{ "patchline": { "source": ["obj-in1", 0], "destination": ["obj-route-note", 0] } },
			{ "patchline": { "source": ["obj-route-note", 0], "destination": ["obj-unpack", 0] } },

			{ "patchline": { "source": ["obj-unpack", 0], "destination": ["obj-mtof", 0] } },
			{ "patchline": { "source": ["obj-unpack", 1], "destination": ["obj-velgain", 0] } },
			{ "patchline": { "source": ["obj-unpack", 2], "destination": ["obj-dursplit", 0] } },
			{ "patchline": { "source": ["obj-unpack", 3], "destination": ["obj-sel", 0] } },
			{ "patchline": { "source": ["obj-unpack", 4], "destination": ["obj-lores", 1] } },
			{ "patchline": { "source": ["obj-unpack", 5], "destination": ["obj-velgain", 1] } },

			{ "patchline": { "source": ["obj-mtof", 0], "destination": ["obj-cycle", 0] } },
			{ "patchline": { "source": ["obj-mtof", 0], "destination": ["obj-saw", 0] } },
			{ "patchline": { "source": ["obj-mtof", 0], "destination": ["obj-rect", 0] } },
			{ "patchline": { "source": ["obj-mtof", 0], "destination": ["obj-tri", 0] } },

			{ "patchline": { "source": ["obj-cycle", 0], "destination": ["obj-selector", 1] } },
			{ "patchline": { "source": ["obj-saw", 0], "destination": ["obj-selector", 2] } },
			{ "patchline": { "source": ["obj-rect", 0], "destination": ["obj-selector", 3] } },
			{ "patchline": { "source": ["obj-tri", 0], "destination": ["obj-selector", 4] } },

			{ "patchline": { "source": ["obj-sel", 0], "destination": ["obj-sel1msg", 0] } },
			{ "patchline": { "source": ["obj-sel", 1], "destination": ["obj-sel2msg", 0] } },
			{ "patchline": { "source": ["obj-sel", 2], "destination": ["obj-sel3msg", 0] } },
			{ "patchline": { "source": ["obj-sel", 3], "destination": ["obj-sel4msg", 0] } },
			{ "patchline": { "source": ["obj-sel1msg", 0], "destination": ["obj-selector", 0] } },
			{ "patchline": { "source": ["obj-sel2msg", 0], "destination": ["obj-selector", 0] } },
			{ "patchline": { "source": ["obj-sel3msg", 0], "destination": ["obj-selector", 0] } },
			{ "patchline": { "source": ["obj-sel4msg", 0], "destination": ["obj-selector", 0] } },

			{ "patchline": { "source": ["obj-dursplit", 0], "destination": ["obj-attackmsg", 0] } },
			{ "patchline": { "source": ["obj-dursplit", 0], "destination": ["obj-muteonmsg", 0] } },
			{ "patchline": { "source": ["obj-dursplit", 1], "destination": ["obj-releasedel", 0] } },
			{ "patchline": { "source": ["obj-attackmsg", 0], "destination": ["obj-env", 0] } },
			{ "patchline": { "source": ["obj-muteonmsg", 0], "destination": ["obj-thispoly", 0] } },
			{ "patchline": { "source": ["obj-releasedel", 0], "destination": ["obj-releasemsg", 0] } },
			{ "patchline": { "source": ["obj-releasedel", 0], "destination": ["obj-mutedel", 0] } },
			{ "patchline": { "source": ["obj-releasemsg", 0], "destination": ["obj-env", 0] } },
			{ "patchline": { "source": ["obj-mutedel", 0], "destination": ["obj-muteoffmsg", 0] } },
			{ "patchline": { "source": ["obj-muteoffmsg", 0], "destination": ["obj-thispoly", 0] } },

			{ "patchline": { "source": ["obj-selector", 0], "destination": ["obj-envmul", 0] } },
			{ "patchline": { "source": ["obj-env", 0], "destination": ["obj-envmul", 1] } },
			{ "patchline": { "source": ["obj-envmul", 0], "destination": ["obj-levelmul", 0] } },
			{ "patchline": { "source": ["obj-velgain", 0], "destination": ["obj-levelmul", 1] } },
			{ "patchline": { "source": ["obj-levelmul", 0], "destination": ["obj-lores", 0] } },
			{ "patchline": { "source": ["obj-lores", 0], "destination": ["obj-out1", 0] } },
			{ "patchline": { "source": ["obj-lores", 0], "destination": ["obj-out2", 0] } }
		]
	}
}
