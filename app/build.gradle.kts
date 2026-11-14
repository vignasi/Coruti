plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val buildNumber = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1

android {
    namespace = "com.vignasi.rutinacore"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.vignasi.rutinacore"
        minSdk = 26
        targetSdk = 34
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    // Clave fija para que cada versión nueva se instale encima de la anterior
    signingConfigs {
        create("release") {
            storeFile = file("rutina.keystore")
            storePassword = "rutinacore"
            keyAlias = "rutina"
            keyPassword = "rutinacore"
            storeType = "pkcs12"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

// La figura 3D (three.js, modelos) y la dibujada viven en docs/diseno/figura/ (D1): se copian al APK al compilar,
// así hay una sola copia en el repo. La página las carga en https://appassets.androidplatform.net/figura/…
val figuraAssets = layout.buildDirectory.dir("generated/figura-assets")
val copiarFigura by tasks.registering(Copy::class) {
    from(rootProject.file("docs/diseno/figura")) {
        include("figura.js", "figura3d.js", "three/**", "modelos/*.glb")
    }
    into(figuraAssets.map { it.dir("figura") })
}
android.sourceSets.getByName("main").assets.srcDir(figuraAssets)

// Imágenes del widget (C2): las WebP de la figura 3D (docs/diseno/figura/widget/, D1) entran como recursos,
// fig_<m|f>_<ejercicio>_<fase>.webp: las de claro en drawable-nodpi y las de oscuro en drawable-night-nodpi, así el
// widget sigue al tema del móvil sin hacer nada. Solo los ejercicios de rutina.json (las sobrantes no entran).
val figuraRes = layout.buildDirectory.dir("generated/figura-res")
val imagenesWidget by tasks.registering(Copy::class) {
    val rutina = file("src/main/assets/rutina.json")
    inputs.file(rutina)
    @Suppress("UNCHECKED_CAST")
    val ejercicios = (groovy.json.JsonSlurper().parse(rutina) as Map<String, Any>)["exercises"] as Map<String, Map<String, Any>>
    val nombres = ejercicios.flatMap { (k, ex) -> (ex["phases"] as List<*>).indices.map { "${k}_$it.webp" } }
    for ((tema, carpeta) in listOf("claro" to "drawable-nodpi", "oscuro" to "drawable-night-nodpi")) {
        for (g in listOf("m", "f")) {
            from(rootProject.file("docs/diseno/figura/widget/$g/$tema")) {
                include(nombres)
                rename { "fig_${g}_$it" }
                into(carpeta)
            }
        }
    }
    into(figuraRes)
}
android.sourceSets.getByName("main").res.srcDir(figuraRes)
tasks.named("preBuild") { dependsOn(copiarFigura, imagenesWidget) }

dependencies {
    // Solo para las pruebas en el ordenador (gradle testReleaseUnitTest); no entran en el APK
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}
