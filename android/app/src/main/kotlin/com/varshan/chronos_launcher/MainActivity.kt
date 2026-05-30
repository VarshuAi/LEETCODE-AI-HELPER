package com.varshan.chronos_launcher

import android.content.Intent
import android.content.pm.ResolveInfo
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.varshan.chronos/apps"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getInstalledApps" -> {
                    val apps = getInstalledAppsList()
                    result.success(apps)
                }
                "launchApp" -> {
                    val packageName = call.argument<String>("packageName")
                    if (packageName != null) {
                        val launched = launchApp(packageName)
                        result.success(launched)
                    } else {
                        result.error("INVALID_PACKAGE", "Package name was null", null)
                    }
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun getInstalledAppsList(): List<Map<String, Any>> {
        val appsList = mutableListOf<Map<String, Any>>()
        val intent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        
        val pm = packageManager
        val resolveInfoList: List<ResolveInfo> = pm.queryIntentActivities(intent, 0)
        
        for (resolveInfo in resolveInfoList) {
            val appInfo = mutableMapOf<String, Any>()
            val appName = resolveInfo.loadLabel(pm).toString()
            val packageName = resolveInfo.activityInfo.packageName
            
            appInfo["name"] = appName
            appInfo["packageName"] = packageName
            appsList.add(appInfo)
        }
        
        // Sort alphabetically
        appsList.sortBy { (it["name"] as String).lowercase() }
        return appsList
    }

    private fun launchApp(packageName: String): Boolean {
        val pm = packageManager
        val launchIntent = pm.getLaunchIntentForPackage(packageName)
        return if (launchIntent != null) {
            startActivity(launchIntent)
            true
        } else {
            false
        }
    }
}
