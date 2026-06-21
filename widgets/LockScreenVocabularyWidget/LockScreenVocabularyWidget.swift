import SwiftUI
import WidgetKit

private let appGroupIdentifier = "__APP_GROUP_IDENTIFIER__"
private let storageKey = "lockScreenVocabularyPayload"
private let fallbackDeepLink = URL(string: "imagevocaapp://")

struct VocabularyPayload: Decodable {
  let courseId: String
  let dayNumber: Int
  let word: String
  let pronunciation: String?
  let meaning: String?
  let meaningHidden: Bool
  let updatedAt: String
  let deepLink: String
}

struct VocabularyEntry: TimelineEntry {
  let date: Date
  let payload: VocabularyPayload?
}

struct LockScreenVocabularyProvider: TimelineProvider {
  func placeholder(in context: Context) -> VocabularyEntry {
    VocabularyEntry(
      date: Date(),
      payload: VocabularyPayload(
        courseId: "TOEIC",
        dayNumber: 1,
        word: "vocabulary",
        pronunciation: nil,
        meaning: nil,
        meaningHidden: true,
        updatedAt: ISO8601DateFormatter().string(from: Date()),
        deepLink: "imagevocaapp://"
      )
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (VocabularyEntry) -> Void) {
    completion(VocabularyEntry(date: Date(), payload: readPayload()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<VocabularyEntry>) -> Void) {
    let entry = VocabularyEntry(date: Date(), payload: readPayload())
    let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
    completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
  }

  private func readPayload() -> VocabularyPayload? {
    guard
      let defaults = UserDefaults(suiteName: appGroupIdentifier),
      let raw = defaults.string(forKey: storageKey),
      let data = raw.data(using: .utf8)
    else {
      return nil
    }

    return try? JSONDecoder().decode(VocabularyPayload.self, from: data)
  }
}

struct LockScreenVocabularyWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: VocabularyEntry

  var body: some View {
    Group {
      if let payload = entry.payload {
        payloadView(payload)
      } else {
        fallbackView
      }
    }
    .widgetURL(widgetUrl)
    .widgetContainerBackground()
  }

  private var widgetUrl: URL? {
    guard let deepLink = entry.payload?.deepLink else {
      return fallbackDeepLink
    }
    return URL(string: deepLink) ?? fallbackDeepLink
  }

  private func payloadView(_ payload: VocabularyPayload) -> some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("Day \(payload.dayNumber)")
        .font(.caption2.weight(.semibold))
        .foregroundStyle(.secondary)
      Text(payload.word)
        .font(family == .accessoryInline ? .caption : .headline.weight(.semibold))
        .lineLimit(1)
        .minimumScaleFactor(0.68)
      if family != .accessoryInline {
        Text(payload.meaningHidden ? (payload.pronunciation ?? "Unlock to study") : (payload.meaning ?? "Unlock to study"))
          .font(.caption2)
          .foregroundStyle(.secondary)
          .lineLimit(1)
          .minimumScaleFactor(0.72)
      }
    }
  }

  private var fallbackView: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("Voca")
        .font(.caption2.weight(.semibold))
        .foregroundStyle(.secondary)
      Text("Prepare words")
        .font(.headline.weight(.semibold))
        .lineLimit(1)
        .minimumScaleFactor(0.72)
      if family != .accessoryInline {
        Text("Open the app")
          .font(.caption2)
          .foregroundStyle(.secondary)
          .lineLimit(1)
      }
    }
  }
}

private extension View {
  @ViewBuilder
  func widgetContainerBackground() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(.fill.tertiary, for: .widget)
    } else {
      self
    }
  }
}

@main
struct LockScreenVocabularyWidget: Widget {
  let kind: String = "LockScreenVocabularyWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: LockScreenVocabularyProvider()) { entry in
      LockScreenVocabularyWidgetView(entry: entry)
    }
    .configurationDisplayName("Vocabulary")
    .description("Shows one word from your next course day.")
    .supportedFamilies([.accessoryRectangular, .accessoryInline])
  }
}
