import { MotionConfig } from 'framer-motion';
import { Stage } from './components/stage/Stage';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Stage />
    </MotionConfig>
  );
}
