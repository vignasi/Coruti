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
