import { Component, type ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import { Button, styles } from "./ui";

/** Recover render failures without deleting the saved session or offline drafts. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; revision: number }> {
  state = { failed: false, revision: 0 };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <SafeAreaView style={{ flex: 1, justifyContent: "center", backgroundColor: "#f3f6f3", padding: 24 }}>
      <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>Let’s reopen your workspace</Text>
        <Text accessibilityRole="alert" style={styles.subtitle}>This screen could not be displayed. Your saved work is still on this device.</Text>
        <Button label="Reopen app" onPress={() => this.setState(state => ({ failed: false, revision: state.revision + 1 }))} />
      </View>
    </SafeAreaView>;
    return <View key={this.state.revision} style={{ flex: 1 }}>{this.props.children}</View>;
  }
}
