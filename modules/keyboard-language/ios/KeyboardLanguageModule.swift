import ExpoModulesCore
import UIKit

fileprivate weak var keyboardLanguageCurrentResponder: UIResponder?

private extension UIResponder {
  static func keyboardLanguageFindCurrentResponder() -> UIResponder? {
    keyboardLanguageCurrentResponder = nil
    UIApplication.shared.sendAction(
      #selector(UIResponder.keyboardLanguageCaptureResponder),
      to: nil,
      from: nil,
      for: nil
    )
    return keyboardLanguageCurrentResponder
  }

  @objc func keyboardLanguageCaptureResponder() {
    keyboardLanguageCurrentResponder = self
  }
}

public class KeyboardLanguageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KeyboardLanguage")

    AsyncFunction("getCurrentInputLanguage") { () -> String? in
      return self.getCurrentInputLanguage()
    }

    AsyncFunction("preferInputLanguage") { (language: String) -> String? in
      return self.getPreferredAvailableLanguage(language)
    }
  }

  private func getCurrentInputLanguage() -> String? {
    let resolve = {
      UIResponder.keyboardLanguageFindCurrentResponder()?.textInputMode?.primaryLanguage
    }

    if Thread.isMainThread {
      return resolve()
    }

    var language: String?
    DispatchQueue.main.sync {
      language = resolve()
    }
    return language
  }

  private func getPreferredAvailableLanguage(_ language: String) -> String? {
    let target = language.lowercased().split(separator: "-").first.map(String.init)
    let resolve = {
      UITextInputMode.activeInputModes
        .compactMap { $0.primaryLanguage }
        .first { inputLanguage in
          guard let target else { return false }
          return inputLanguage.lowercased().split(separator: "-").first.map(String.init) == target
        }
    }

    if Thread.isMainThread {
      return resolve()
    }

    var preferredLanguage: String?
    DispatchQueue.main.sync {
      preferredLanguage = resolve()
    }
    return preferredLanguage
  }
}
