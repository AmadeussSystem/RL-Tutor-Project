"""
Q-Learning Agent for Adaptive Content Selection
"""
import numpy as np
import json
import os
from typing import Dict, Tuple, List
from app.core.config import settings


class QLearningAgent:
    """
    Reinforcement Learning Agent for personalized content recommendation.
    Uses Q-learning to learn optimal content selection policy.
    """
    
    def __init__(self, 
                 num_states: int = 100, 
                 num_actions: int = 20,
                 learning_rate: float = None,
                 discount_factor: float = None,
                 epsilon: float = None):
        """
        Initialize Q-learning agent
        
        Args:
            num_states: Number of discretized states (knowledge levels)
            num_actions: Number of possible actions (content items)
            learning_rate: Learning rate (alpha)
            discount_factor: Discount factor (gamma)
            epsilon: Exploration rate
        """
        self.num_states = num_states
        self.num_actions = num_actions
        self.learning_rate = learning_rate or settings.LEARNING_RATE
        self.discount_factor = discount_factor or settings.DISCOUNT_FACTOR
        self.epsilon = epsilon or settings.EPSILON
        
        # Initialize Q-table
        self.q_table = np.zeros((num_states, num_actions))
        
        # Training statistics
        self.total_updates = 0
        self.episode_rewards = []
    
    def _discretize_state(self, knowledge_state: Dict) -> int:
        """
        Convert continuous knowledge state to discrete state index
        
        Args:
            knowledge_state: Dict with topic scores (0-1)
        
        Returns:
            Discrete state index (0 to num_states-1)
        """
        # Extract knowledge scores
        scores = [
            knowledge_state.get('algebra_score', 0.5),
            knowledge_state.get('calculus_score', 0.5),
            knowledge_state.get('geometry_score', 0.5),
            knowledge_state.get('statistics_score', 0.5)
        ]
        
        # Create composite score (average)
        avg_score = np.mean(scores)
        
        # Discretize to state index
        state_index = int(avg_score * (self.num_states - 1))
        state_index = max(0, min(state_index, self.num_states - 1))
        
        return state_index
    
    def select_action(self, state: int, available_actions: List[int] = None) -> int:
        """
        Select action using epsilon-greedy policy
        
        Args:
            state: Current state index
            available_actions: List of valid action indices (content IDs)
        
        Returns:
            Selected action index
        """
        if available_actions is None:
            available_actions = list(range(self.num_actions))
        
        # Epsilon-greedy exploration
        if np.random.random() < self.epsilon:
            # Explore: random action
            return np.random.choice(available_actions)
        else:
            # Exploit: best known action
            q_values = self.q_table[state, available_actions]
            best_action_idx = np.argmax(q_values)
            return available_actions[best_action_idx]
    
    def update_q_value(self, state: int, action: int, reward: float, next_state: int):
        """
        Update Q-value using Q-learning update rule
        
        Q(s,a) = Q(s,a) + α * (reward + γ * max(Q(s',a')) - Q(s,a))
        
        Args:
            state: Current state
            action: Action taken
            reward: Reward received
            next_state: Next state after action
        """
        current_q = self.q_table[state, action]
        max_next_q = np.max(self.q_table[next_state])
        
        # Q-learning update
        new_q = current_q + self.learning_rate * (
            reward + self.discount_factor * max_next_q - current_q
        )
        
        self.q_table[state, action] = new_q
        self.total_updates += 1
    
    def calculate_reward(self, 
                        is_correct: bool, 
                        time_spent: float,
                        difficulty: int,
                        student_level: float) -> float:
        """
        Calculate reward based on learning interaction
        
        Reward components:
        1. Correctness (+1 if correct, -0.5 if wrong)
        2. Time efficiency (bonus for quick correct answers)
        3. Difficulty match (bonus for appropriate challenge level)
        
        Args:
            is_correct: Whether answer was correct
            time_spent: Time spent on question (seconds)
            difficulty: Question difficulty (1-5)
            student_level: Student's current knowledge level (0-1)
        
        Returns:
            Reward value
        """
        reward = 0.0
        
        # Base correctness reward
        if is_correct:
            reward += 1.0
            
            # Time efficiency bonus (faster is better, but cap it)
            if time_spent < 30:
                reward += 0.2
            elif time_spent < 60:
                reward += 0.1
        else:
            reward -= 0.5
        
        # Difficulty appropriateness bonus
        # Reward content that matches student level
        expected_difficulty = 1 + student_level * 4  # Scale to 1-5
        difficulty_diff = abs(difficulty - expected_difficulty)
        
        if difficulty_diff < 1:
            reward += 0.3  # Good match
        elif difficulty_diff > 2:
            reward -= 0.2  # Poor match (too easy or too hard)
        
        return reward
    
    def get_recommended_content(self, 
                                knowledge_state: Dict,
                                available_content_ids: List[int],
                                learning_style: str = None,
                                pace_profile: Dict = None) -> Tuple[int, float]:
        """
        Get recommended content for student
        
        Args:
            knowledge_state: Student's current knowledge state
            available_content_ids: List of available content IDs
            learning_style: Student's dominant learning style (V/A/R/K/Multimodal)
            pace_profile: Student's learning pace data (speed, difficulty_preference, etc.)
        
        Returns:
            Tuple of (content_id, confidence_score)
        """
        state = self._discretize_state(knowledge_state)
        
        # Get Q-values for available actions
        q_values = self.q_table[state, available_content_ids]
        
        # Apply learning style bonus if provided
        if learning_style and learning_style != "Multimodal":
            # Boost Q-values for content matching learning style
            # This could be enhanced with actual content type metadata
            # For now, we apply a small boost to simulate preference
            style_boost = 0.1
            q_values = q_values + style_boost
        
        # Apply pace-based adjustments
        if pace_profile:
            pace_category = pace_profile.get('pace_category', 'normal')
            difficulty_pref = pace_profile.get('difficulty_preference', 5)
            fast_track = pace_profile.get('fast_track_mode', False)
            
            # Adjust Q-values based on pace
            if fast_track or pace_category in ['fast', 'very_fast']:
                # Boost harder content for fast learners
                # Assume higher content IDs = harder (this is simplified)
                q_values = q_values + np.linspace(0, 0.2, len(q_values))
            elif pace_category in ['slow', 'very_slow']:
                # Boost easier content for slower learners
                q_values = q_values + np.linspace(0.2, 0, len(q_values))
            
            # Apply difficulty preference scaling
            difficulty_scale = (difficulty_pref - 5) / 10  # -0.5 to +0.5
            q_values = q_values + difficulty_scale
        
        # Select best action
        best_idx = np.argmax(q_values)
        recommended_content_id = available_content_ids[best_idx]
        confidence = q_values[best_idx]
        
        return recommended_content_id, float(confidence)
    
    def save_model(self, filepath: str = "models/q_table.npy"):
        """Save Q-table to file"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        np.save(filepath, self.q_table)
        
        # Save metadata
        metadata = {
            'num_states': self.num_states,
            'num_actions': self.num_actions,
            'learning_rate': self.learning_rate,
            'discount_factor': self.discount_factor,
            'epsilon': self.epsilon,
            'total_updates': self.total_updates
        }
        with open(filepath.replace('.npy', '_meta.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def load_model(self, filepath: str = "models/q_table.npy"):
        """Load Q-table from file"""
        if os.path.exists(filepath):
            self.q_table = np.load(filepath)
            
            # Load metadata
            meta_path = filepath.replace('.npy', '_meta.json')
            if os.path.exists(meta_path):
                with open(meta_path, 'r') as f:
                    metadata = json.load(f)
                    self.total_updates = metadata.get('total_updates', 0)
    
    def get_statistics(self) -> Dict:
        """Get agent training statistics"""
        q_table_size = self.q_table.shape[0] * self.q_table.shape[1] if len(self.q_table.shape) > 1 else 0
        
        return {
            'total_sessions': self.total_updates,
            'total_updates': self.total_updates,
            'q_table_size': q_table_size,
            'q_table_shape': list(self.q_table.shape),
            'mean_q_value': float(np.mean(self.q_table)),
            'max_q_value': float(np.max(self.q_table)),
            'learning_rate': self.learning_rate,
            'epsilon': self.epsilon,
            'exploration_rate': self.epsilon,  # Frontend expects this
            'avg_reward': float(np.mean(self.q_table)) if self.total_updates > 0 else 0.0
        }


# Global agent instance
agent = QLearningAgent()

# Try to load existing model
try:
    agent.load_model()
except:
    pass  # Use new Q-table if no saved model exists
