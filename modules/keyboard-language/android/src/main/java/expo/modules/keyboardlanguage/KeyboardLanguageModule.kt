package expo.modules.keyboardlanguage

import android.content.Context
import android.os.Build
import android.view.inputmethod.InputMethodManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KeyboardLanguageModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KeyboardLanguage")

    AsyncFunction("getCurrentInputLanguage") {
      getCurrentInputLanguage()
    }

    AsyncFunction("preferInputLanguage") { language: String ->
      getCurrentInputLanguage() ?: language
    }
  }

  private fun getCurrentInputLanguage(): String? {
    val context = appContext.reactContext ?: return null
    val inputMethodManager =
      context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
        ?: return null
    val subtype = inputMethodManager.currentInputMethodSubtype ?: return null

    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      subtype.languageTag.takeIf { it.isNotBlank() } ?: subtype.locale
    } else {
      subtype.locale
    }.takeIf { it.isNotBlank() }
  }
}
