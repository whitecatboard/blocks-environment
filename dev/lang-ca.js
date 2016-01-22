/*
    based on Snap! by Jens Mönig
    jens@moenig.org

    Catalan translation for WhiteCat

    Copyright (C) 2015 by Bernat Romagosa
    Edutec Research Group, Citilab - Cornellà de Llobregat (Barcelona)
    bromagosa@citilab.eu
    
    This file is part of WhiteCat.
    WhiteCat is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of
    the License, or (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*global SnapTranslator*/

SnapTranslator.dict.ca = {

/*
    Special characters: (see <http://0xcc.net/jsescape/>)

    Ä, ä   \u00c4, \u00e4
    Ö, ö   \u00d6, \u00f6
    Ü, ü   \u00dc, \u00fc
    ß      \u00df
*/

    // translations meta information
    'language_name':
        'Català', // the name as it should appear in the language menu
    'language_translator':
        'Bernat Romagosa Carrasquer', // your name for the Translators tab
    'translator_e-mail':
        'bromagosa@citilab.eu', // optional
    'last_changed':
        '2016-01-20', // this, too, will appear in the Translators tab

    // GUI
    // control bar:
    'untitled':
        'Sense títol',
    'development mode':
        'mode de desenvolupament',

    // categories:
    'Control':
        'Control',
    'Operators':
        'Operadors',
    'Data':
        'Dades',
    'Input / output':
        'Entrada/sortida',
    'Lists':
        'Llistes',
    'Comm':
        'Comunicació',
    'Custom blocks':
        'Blocs propis',

    // primitive blocks:

    /*
        Attention Translators:
        ----------------------
        At this time your translation of block specs will only work
        correctly, if the order of formal parameters and their types
        are unchanged. Placeholders for inputs (formal parameters) are
        indicated by a preceding % prefix and followed by a type
        abbreviation.

        For example:

            'say %s for %n secs'

        can currently not be changed into

            'say %n secs long %s'

        and still work as intended.

        Similarly

            'point towards %dst'

        cannot be changed into

            'point towards %cst'

        without breaking its functionality.
    */

    // control:
    'when %greenflag clicked':
        'Quan es premi %greenflag',
    'wait %n %timeScale':
        'espera %n %timeScale',
    'forever %c':
        'per sempre %c',
    'repeat %n %c':
        'repeteix %n vegades %c',
    'if %s %c':
        'si %s llavors %c',
    'if %s %c else %c':
        'si %s llavors %c si no %c',
    'report %s':
        'retorna %s',
    
    // operators:
    '%n mod %n':
        'residu de dividir %n entre %n',
    'round %n':
        'arrodoneix %n',
    '%fun of %n':
        '%fun de %n',
    'pick random %n to %n':
        'nombre a l\'atzar entre %n i %n',
    '%s and %s':
        '%s i %s',
    '%s or %s':
        '%s o %s',
    'not %s':
        'no %s',
    'true':
        'cert',
    'false':
        'fals',
    'join %words':
        'unir %words',
    'hello':
        'hola,',
    'world':
        'món',
    'timer value':
        'valor del rellotge',
    'run lua %s':
        'executa lua %s',

    // variables:
    'Make a variable':
        'Crear una variable',
    'Variable name':
        'Nom de variable',
    'Script variable name':
        'Nom de la variable de programa',
    'Delete a variable':
        'Esborrar una variable',

    'set %var to %s':
        'assigna a %var el valor %s',
    'change %var by %n':
        'augmenta %var en %n',

    // lists:
    'list %exp':
        'llista %exp',
    'item %n of %l':
        'element %n de %l',
    'length of %l':
        'longitud de %l',
    '%l contains %s ?':
        '%l conté %s ?',
    'thing':
        'cosa',
    'add %s to %l':
        'afegeix %s a %l',
    'delete item %n of %l':
        'esborra element %n de %l',
    'insert %s at %n of %l':
        'insereix %s a la posició %n de %l',
    'replace item %n of %l with %s':
        'substitueix element %n de %l per %s',

    // Input / output
    'set pin %digitalPin to digital %s':
        'posa pin digital %digitalPin a %s',
    'set pin %pwmPin to analog %n':
        'posa pin analògic %pwmPin a %n',
    'get digital value from pin %digitalPin':
        'valor de pin digital %digitalPin',
    'get analog value from pin %analogPin':
        'valor de pin analògic %analogPin',
    'set servo %pwmPin to %servoValue':
        'posa servomotor %pwmPin a %servoValue',

    // Comm

    'message':
        'missatge',
    'Connect to MQTT broker':
        'Connecta amb broker d\'MQTT',
    'when I receive %upvar at topic %s':
        'quan rebi un %upvar sobre el tema %s',
    'broadcast %s at topic %s':
        'envia %s sobre el tema %s',
    'hello network':
        'hola, xarxa',

    // Custom blocks
    'Not available yet':
        'Encara no disponible',
    'Make a block':
        'Crea un bloc',

    // menus
    // snap menu
    'About...':
        'Sobre WhiteCat',
    'Reference manual':
        'Manual de referència',
    'WhiteCat website':
        'Web de WhiteCat',
    'Download source':
        'Descarregar codi font',
    'Switch back to user mode':
        'Tornar a mode d\'usuari',
    'disable deep-Morphic\ncontext menus\nand show user-friendly ones':
        'canviar menús contextuals\nprimitius de Morphic\nper menús més amigables',
    'Switch to dev mode':
        'Canviar a mode desenvolupador',
    'enable Morphic\ncontext menus\nand inspectors,\nnot user-friendly!':
        'habilitar menús\ncontextuals de\nMorphic i inspectors,\nmode expert!',

    // project menu
    'Project notes...':
        'Notes del projecte...',
    'New':
        'Nou',
    'Save to disk':
        'Desar a disc',
    'Load from disk':
        'Carregar de disc',

    // settings menu
    'Language...':
        'Idioma...',
    'Zoom blocks...':
        'Mida dels blocs...',
    'Default':
        'Per defecte',

    // inputs
    'with inputs':
        'amb entrades',
    'input names:':
        'noms d\'entrades:',
    'Input Names:':
        'Noms d\'entrades:',
    'input list:':
        'llista d\'entrades:',

    // context menus:
    'help':
        'ajuda',

    // palette:
    'hide primitives':
        'amaga blocs primitius',
    'show primitives':
        'mostra blocs primitius',

    // blocks:
    'help...':
        'ajuda...',
    'relabel...':
        'canvia\'m el nom...',
    'duplicate':
        'duplica\'m',
    'make a copy\nand pick it up':
        'crea una còpia\ni agafa-la',
    'only duplicate this block':
        'duplica només aquest bloc',
    'delete':
        'esborra\'m',
    'script pic...':
        'mostra la meva imatge...',
    'open a new window\nwith a picture of this script':
        'obre una nova finestra\namb una imatge d\'aquest programa',
    'ringify':
        'encapsula\'m',
    'unringify':
        'des-encapsula\'m',

    // custom blocks:
    'delete block definition...':
        'esborra la definició d\'aquest bloc',
    'edit...':
        'edita...',

    // scripting area
    'clean up':
        'neteja',
    'arrange scripts\nvertically':
        'alinea els programes\nverticalment',
    'add comment':
        'afegeix un comentari',
    'undrop':
        'recupera bloc',
    'undo the last\nblock drop\nin this pane':
        'recupera l\'últim bloc\nque s\'hagi llençat',
    'scripts pic...':
        'exportar com a imatge...',
    'open a new window\nwith a picture of all scripts':
        'obre una nova finestra\namb una foto d\'aquests programes',
    'make a block...':
        'crea un bloc...',

    // dialogs
    // buttons
    'OK':
        'D\'acord',
    'Ok':
        'D\'acord',
    'Cancel':
        'Cancel·la',
    'Yes':
        'Sí',
    'No':
        'No',

    // help
    'Help':
        'Ajuda',

    // zoom blocks
    'Zoom blocks':
         'Canvia la mida dels blocs',
    'build':
        'construeix',
    'your own':
        'els teus propis',
    'blocks':
        'blocs',
    'normal (1x)':
        'normal (1x)',
    'demo (1.2x)':
        'demostració (1.2x)',
    'presentation (1.4x)':
        'presentació (1.4x)',
    'big (2x)':
        'gran (2x)',
    'huge (4x)':
        'immens (4x)',
    'giant (8x)':
        'gegant (8x)',
    'monstrous (10x)':
        'monstruós (10x)',

    // Project Manager
    'Untitled':
        'Sense títol',
    'Open Project':
        'Obre projecte',
    '(empty)':
        '(buit)',
    'Saved!':
        'Desat!',
    'Delete Project':
        'Esborra projecte',
    'Are you sure you want to delete':
        'Segur que vols esborrar',
    'rename...':
        'canvia el nom...',

    // project notes
    'Project Notes':
        'Notes del projecte',

    // new project
    'New Project':
        'Nou projecte',
    'Replace the current project with a new one?':
        'Vols substituir el projecte actual per un de nou?',

    // save project
    'Save Project As...':
        'Anomena i desa projecte...',

    // export blocks
    'Export blocks':
        'Exporta blocs',
    'Import blocks':
        'Importa blocs',
    'this project doesn\'t have any\ncustom global blocks yet':
        'aquest projecte encara no\nté cap bloc personalitzat',
    'select':
        'seleccionar',
    'none':
        'cap bloc',

    // block dialog
    'Change block':
        'Canvia el bloc',
    'Command':
        'Comanda',
    'Reporter':
        'Reportador',
    'Predicate':
        'Predicat',

    // block editor
    'Block Editor':
        'Editor de blocs',
    'Apply':
        'Aplica',

    // block deletion dialog
    'Delete Custom Block':
        'Esborrar un bloc personalitzat',
    'block deletion dialog text':
        'Segur que vols esborrar la definició\nd\'aquest bloc?',

    // input dialog
    'Create input name':
        'Crear ranura',
    'Edit input name':
        'Editar ranura',
    'Edit label fragment':
        'Editar fragment d\'etiqueta',
    'Title text':
        'Text del títol',
    'Input name':
        'Nom de la ranura',
    'Delete':
        'Esborra',
    'Object':
        'Objecte',
    'Number':
        'Nombre',
    'Text':
        'Text',
    'List':
        'Llista',
    'Any type':
        'Qualsevol tipus',
    'Boolean (T/F)':
        'Booleà (C/F)',
    'Command\n(inline)':
        'Comanda\n(inserida)',
    'Command\n(C-shape)':
        'Comanda\n(en forma de C)',
    'Any\n(unevaluated)':
        'Qualsevol\n(sense evaluar)',
    'Boolean\n(unevaluated)':
        'Booleà\n(sense evaluar)',
    'Single input.':
        'Entrada única.',
    'Default Value:':
        'Valor predeterminat:',
    'Multiple inputs (value is list of inputs)':
        'Entrades múltiples (el valor és una llista d\'entrades)',
    'Upvar - make internal variable visible to caller':
        'Variable interna visible des de l\'exterior',

    // About Snap
    'About WhiteCat':
        'Sobre WhiteCat',
    'Back...':
        'Enrere...',
    'License...':
        'Llicència...',
    'Modules...':
        'Mòduls...',
    'Credits...':
        'Crèdits...',
    'Translators...':
        'Traductors',
    'License':
        'Llicència',
    'current module versions:':
        'versions del mòdul actual',
    'Contributors':
        'Contribuïdors',
    'Translations':
        'Traduccions',

    // variable watchers
    'normal':
        'normal',
    'large':
        'gran',
    'slider':
        'lliscador',
    'slider min...':
        'valor mínim del lliscador...',
    'slider max...':
        'valor màxim del lliscador...',
    'import...':
        'importa...',
    'Slider minimum value':
        'Valor mínim del lliscador...',
    'Slider maximum value':
        'Valor màxim del lliscador...',

    // list watchers
    'length: ':
        'longitud: ',

    // coments
    'add comment here...':
        'afegir un comentari aquí...',

    // messages
    'new...':
        'nou...',
    'No boards found.\nPlease enter the serial port name\nor leave blank to retry discovery\nand press OK':
        'No s\'ha trobat cap placa.\nSi us plau, introdueix el nom\ndel port sèrie, o deixa\'l en blanc per\ntornar a provar el descobriment\nautomàtic, i clica "D\'acord"',
    'select a port':
        'selecciona un port',
    'Board connected at ':
        'Placa connectada a ',
    'Waiting for board to be ready...':
        'Esperant que la placa estigui llesta...',
    '\nIf this takes too long, try resetting the board\nby connecting P04 (GND) and P05 (MCLR) together.':
        '\nSi això triga massa, intenta reiniciar la placa\nconnectant el pin P04 (GND) amb el P05 (MCLR).',
    'Board ready.':
        'Placa preparada',

    // math functions
    'abs':
        'valor absolut',
    'floor':
        'part entera',
    'sqrt':
        'arrel quadrada',
    'sin':
        'sin',
    'cos':
        'cos',
    'tan':
        'tan',
    'asin':
        'asin',
    'acos':
        'acos',
    'atan':
        'atan',
    'ln':
        'ln',
    'e^':
        'e^',

    // delimiters
    'letter':
        'lletra',
    'whitespace':
        'espai en blanc',
    'line':
        'línia',
    'tab':
        'tabulador',
    'cr':
        'retorn de carro',

    // data types
    'number':
        'nombre',
    'text':
        'text',
    'Boolean':
        'Booleà',
    'list':
        'llista',
    'command':
        'comanda',
    'reporter':
        'reporter',
    'predicate':
        'predicat',

    // time scales
    'seconds':
        'segons',
    'milliseconds':
        'milisegons',
    'microseconds':
        'microsegons',

    // servo values
    'clockwise':
        'horari',
    'counter-clockwise':
        'anti-horari',
    'stopped':
        'aturat',
    'degrees':
        'graus',

    // list indices
    'last':
        'últim',
    'any':
        'qualsevol'
};
