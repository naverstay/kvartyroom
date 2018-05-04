// npm link grunt grunt-contrib-pug grunt-contrib-watch grunt-contrib-uglify grunt-contrib-imagemin grunt-wellington grunt-imageoptim load-grunt-tasks pug-inheritance

module.exports = function (grunt) {
    grunt.initConfig({
        watch: {
            templates: {
                files: ['jade/*.jade', 'jade/*.pug'],
                tasks: ['pug'],
                options: {
                    spawn: false
                }
            },
            styles: {
                files: ['sass/*.scss'],
                tasks: ['wellington'],
                options: {
                    spawn: false
                }
            }
        },
        wellington: {
            your_target: {
                src: [
                    'sass/main_global.scss',
                    'sass/header_global.scss'
                    //'sass/**/*.scss'
                ],
                options: {
                    //debug: true,
                    p: 'sass',
                    b: 'styles',
                    s: grunt.file.readJSON('config.json').prod ? 'compressed' : 'expanded',
                    d: 'i/src',
                    gen: 'i/dist',
                    font: 'fonts'
                }
            }
        },
        uglify: {
            all: {
                options: {
                    compress: {
                        drop_console: true
                    },
                    sourceMap: false,
                    mangle: false
                },
                files: {
                    'js/main.min.js': grunt.file.readJSON('config.json').scripts
                }
            }
        },
        imagemin: {
            png: {
                options: {
                    optimizationLevel: 7
                },
                files: [
                    {
                        // Set to true to enable the following options…
                        expand: true,
                        // cwd is 'current working directory'
                        cwd: 'i/',
                        src: ['**/*.png'],
                        // Could also match cwd line above. i.e. project-directory/img/
                        dest: 'i/compressed/',
                        ext: '.png'
                    }
                ]
            },
            jpg: {
                options: {
                    progressive: true
                },
                files: [
                    {
                        // Set to true to enable the following options…
                        expand: true,
                        // cwd is 'current working directory'
                        cwd: 'i/',
                        src: ['**/*.jpg'],
                        // Could also match cwd. i.e. project-directory/img/
                        dest: 'i/compressed/',
                        ext: '.jpg'
                    }
                ]
            }
        },
        pug: {
            compile: {
                options: {
                    basedir: 'jade',
                    pretty: !grunt.file.readJSON('config.json').prod,
                    data: {
                        time: (new Date()).getTime(),
                        prod: grunt.file.readJSON('config.json').prod,
                        scripts_arr: grunt.file.readJSON('config.json').scripts
                    }
                },
                files: [{
                    cwd: "jade/",
                    src: "*.jade",
                    dest: "",
                    expand: true,
                    ext: ".html"
                }]
            }
        }
    });

    var JadeInheritance = require('pug-inheritance');
    var changedFiles = [];

    var onChange = grunt.util._.debounce(function () {
        var options = grunt.config('pug.compile.options');
        var dependantFiles = [];

        options.skip = ['node_modules'];

        changedFiles.forEach(function (filename) {
            var directory = options.basedir;
            var inheritance = new JadeInheritance(filename, directory, options);

            if (/mixins.pug/ig.test(filename)) {
                console.log('\n*** mixins changed, compiling all templates in path "' + directory + '" ***\n');
                dependantFiles.push('*.jade');
            } else {
                dependantFiles = dependantFiles.concat(inheritance.files);
            }
        });

        var config = grunt.config('pug.compile.files')[0];
        config.src = dependantFiles;
        grunt.config('pug.compile.files', [config]);

        changedFiles = [];
    }, 100);

    grunt.event.on('watch', function (action, filepath, type) {
        if (type === 'templates') {
            changedFiles.push(filepath);
            onChange();
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-imageoptim');
    grunt.loadNpmTasks('grunt-wellington');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['watch']);
};
