package com.varshan.chronoslauncher

import android.content.Context
import android.content.Intent
import android.content.pm.ResolveInfo
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ChronosLauncherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ChronosLauncherModule")

    AsyncFunction("getInstalledApps") {
      val appsList = mutableListOf<Map<String, Any>>()
      val intent = Intent(Intent.ACTION_MAIN, null).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      
      val pm = appContext.reactContext?.packageManager
      if (pm != null) {
        val resolveInfoList: List<ResolveInfo> = pm.queryIntentActivities(intent, 0)
        
        for (resolveInfo in resolveInfoList) {
          val appInfo = mutableMapOf<String, Any>()
          val appName = resolveInfo.loadLabel(pm).toString()
          val packageName = resolveInfo.activityInfo.packageName
          
          appInfo["name"] = appName
          appInfo["packageName"] = packageName
          appsList.add(appInfo)
        }
        
        appsList.sortBy { (it["name"] as String).lowercase() }
      }
      appsList
    }

    AsyncFunction("launchApp") { packageName: String ->
      val pm = appContext.reactContext?.packageManager
      val launchIntent = pm?.getLaunchIntentForPackage(packageName)
      if (launchIntent != null) {
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        appContext.reactContext?.startActivity(launchIntent)
        true
      } else {
        false
      }
    }
  }
}
