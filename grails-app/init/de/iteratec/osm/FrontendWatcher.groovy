package de.iteratec.osm

import grails.boot.GrailsApp
import grails.util.Environment
import groovy.transform.CompileDynamic
import org.grails.io.watch.DirectoryWatcher

import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.concurrent.ConcurrentLinkedQueue

class FrontendWatcher {

    private static DirectoryWatcher directoryWatcher

    static void initializeFrontendWatcher() {
        FrontendWatcher frontendWatcher = new FrontendWatcher()
        frontendWatcher.startFrontendWatcher(Environment.getCurrent())
    }

    @CompileDynamic
    protected void startFrontendWatcher(Environment environment) {
        String location = environment.getReloadLocation()

        String nodeExecLocation = new FileNameByRegexFinder().getFileNames(Paths.get(location, "build", "nodejs").toString(), "([^\\/]*)((node\\.exe+)|(/bin/node(?!.)))")[0]
        String nodeLocation = new File(nodeExecLocation).getParent()

        if (location && nodeLocation) {

            String frontendDistFolder = Paths.get("${location}/frontend/dist")
            new File(frontendDistFolder).mkdirs()

            Thread.start {
                String nodeModulesBin = Paths.get("${location}", "frontend", "node_modules", ".bin").toString()

                ProcessBuilder watchBuilder
                if( nodeExecLocation.endsWith(".exe") ) { // running on windows?
                    watchBuilder = new ProcessBuilder(["cmd", "/C", "ng build --watch"])
                            .redirectErrorStream(true).directory(new File(location, "frontend"))
                    watchBuilder.environment().put("PATH", "${nodeModulesBin};${nodeLocation}")
                }
                else {
                    watchBuilder = new ProcessBuilder(['sh', '-c', 'ng build --watch'])
                            .redirectErrorStream(true).directory(new File(location, "frontend"))
                    watchBuilder.environment().put("PATH", "${nodeModulesBin}:${nodeLocation}")
                }

                Process recompileFrontend = watchBuilder.start()
                recompileFrontend.in.eachLine { line -> println line }
            }

            directoryWatcher = new DirectoryWatcher()

            Queue<File> changedFiles = new ConcurrentLinkedQueue<>()

            directoryWatcher.addListener(new DirectoryWatcher.FileChangeListener() {
                @Override
                void onChange(File file) {
                    changedFiles << file.canonicalFile
                }

                @Override
                void onNew(File file) {
                    changedFiles << file.canonicalFile
                }
            })

            directoryWatcher.addWatchDirectory(new File(location, "frontend/dist"), ['js', 'css', 'svg', 'png', 'jpg', 'map'])
            String frontendJavascriptsFolder = Paths.get("${location}/grails-app/assets/javascripts/frontend")
            String frontendStylesheetsFolder = Paths.get("${location}/grails-app/assets/stylesheets/frontend")
            String frontendAssetsFolder = Paths.get("${location}/grails-app/assets/other/frontend")

            Thread.start {

                new File(frontendJavascriptsFolder).mkdirs()
                new File(frontendStylesheetsFolder).mkdirs()
                new File(frontendAssetsFolder).mkdirs()

                while (GrailsApp.developmentModeActive) {

                    def uniqueChangedFiles = changedFiles as Set
                    int uniqueChangedFilesSize = uniqueChangedFiles.size()

                    try {
                        if (uniqueChangedFilesSize >= 1) {
                            changedFiles.clear()

                            println "\n Updating ${uniqueChangedFilesSize} frontend files:\n${uniqueChangedFiles}...\n"

                            for (File file : uniqueChangedFiles) {
                                Path src = file.toPath()
                                Path dst

                                if (src.toString().endsWith('.css')) {
                                    dst = Paths.get("${frontendStylesheetsFolder}/${file.getName()}")
                                } else if (src.toString().endsWith(".js")) {
                                    dst = Paths.get("${frontendJavascriptsFolder}/${file.getName()}")
                                } else {
                                    dst = Paths.get("${frontendAssetsFolder}/${file.getName()}")
                                }
                                Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING)
                            }
                            sleep(2000)
                        }
                    } catch (Exception e) {
                        log.error("Exception:  $e.message", e)
                    }
                    sleep(2000)
                }
            }
            directoryWatcher.start()
        }
    }
}
