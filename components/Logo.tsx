import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface LogoProps {
  size?: number;
  animated?: boolean;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

const Logo: React.FC<LogoProps> = ({ size = 48, animated = true }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      scale.value = withRepeat(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedImage
      source={require('../assets/logo.png')}
      style={[
        {
          width: size,
          height: size,
        },
        animated && animatedStyle,
      ]}
      resizeMode="contain"
    />
  );
};

export default Logo;
