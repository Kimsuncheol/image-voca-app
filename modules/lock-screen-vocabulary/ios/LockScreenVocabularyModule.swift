import ExpoModulesCore
import WidgetKit

public class LockScreenVocabularyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LockScreenVocabulary")

    AsyncFunction("setPayload") { (
      appGroupIdentifier: String,
      storageKey: String,
      payloadJson: String?
    ) in
      guard let defaults = UserDefaults(suiteName: appGroupIdentifier) else {
        throw InvalidAppGroupException(appGroupIdentifier)
      }

      if let payloadJson {
        defaults.set(payloadJson, forKey: storageKey)
      } else {
        defaults.removeObject(forKey: storageKey)
      }

      defaults.synchronize()

      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadTimelines(ofKind: "LockScreenVocabularyWidget")
      }
    }
  }
}

private class InvalidAppGroupException: Exception {
  override var reason: String {
    "Unable to open App Group UserDefaults suite: \(appGroupIdentifier)"
  }

  private let appGroupIdentifier: String

  init(_ appGroupIdentifier: String) {
    self.appGroupIdentifier = appGroupIdentifier
  }
}
