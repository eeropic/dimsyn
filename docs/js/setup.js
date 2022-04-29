const MIDI_ENABLED = false

const MIDI_IN_DEV = 1;
const MIDI_OUT_DEV = 1;

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const GRID_SIZE = 20;

const GRID_Y = 10;
const BASENOTE = 0;

const PPQ = 96;
const BPM = 120;

const MIDI_NOTE_440 = 69;

const QNOTE_WIDTH = PPQ;
const GRID_X = QNOTE_WIDTH / 4;
const PPQ_STEP = (QNOTE_WIDTH * 8) / PPQ;

const GLOBAL_QUANTIZE = PPQ / 4;

const LOOP_LENGTH_QNOTES = 8;

const SAMPLERATE = 48000;

//const OSC_FADE_TIME = 1 / (SAMPLERATE / 128);
const OSC_FADE_TIME = 0.008

const LOCATOR_STYLE = {
    strokeWidth: 1,
    strokeColor: 'cyan',
    opacity: 0.3,
};

yPixelScale = 10

const VIEW_HEIGHT = 1280

noteOffset = 0
pianoKeys = [1,0,1,0,1,1,0,1,0,1,0,1]